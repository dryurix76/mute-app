"use client";
import { useState, useEffect, useRef } from "react";
import { getInventario } from "../lib/inventarioApi";
import { getVentas } from "../lib/ventasApi";
import { getGastos } from "../lib/gastosApi";
import { getSession, onAuthChange, signOut } from "../lib/authApi";
import DashboardShell from "../components/DashboardShell";
import LoginScreen from "../components/LoginScreen";

export default function Page() {
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [syncMsg, setSyncMsg] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const dataLoadedRef = useRef(false);

  // Check session once on mount, then listen for changes without re-rendering
  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setAuthChecked(true);
    });

    const subscription = onAuthChange((newSession) => {
      setSession((prev) => {
        // Only update if the logged-in user actually changed (avoid blink on token refresh)
        if (prev?.user?.id !== newSession?.user?.id) return newSession;
        return prev;
      });
    });
    return () => subscription?.unsubscribe();
  }, []);

  async function cargarTodo() {
    setError(null);
    try {
      const [inv, vts, gts] = await Promise.all([
        getInventario(),
        getVentas(),
        getGastos(),
      ]);
      setInventory(inv);
      setVentas(vts);
      setGastos(gts);
    } catch (e) {
      console.error(e);
      setError("No se pudo conectar a la base de datos.");
    } finally {
      setInitialLoading(false);
    }
  }

  async function sincronizarGoogleSheets() {
    setSyncMsg("Sincronizando con Google Sheets...");
    try {
      const res = await fetch("/api/sync-sheets", { method: "POST" });
      const data = await res.json();
      setSyncMsg(
        data.ok
          ? data.ventasNuevas > 0
            ? `${data.ventasNuevas} venta(s) nueva(s) importadas desde Google Sheets.`
            : "Sincronizado con Google Sheets — sin cambios nuevos."
          : "No se pudo sincronizar: " + data.error
      );
    } catch {
      setSyncMsg("No se pudo sincronizar con Google Sheets.");
    } finally {
      setTimeout(() => setSyncMsg(""), 5000);
    }
  }

  // Load data only once when session is first established
  useEffect(() => {
    if (session && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      cargarTodo();
    }
    if (!session) {
      dataLoadedRef.current = false;
      setInitialLoading(true);
    }
  }, [session]);

  // Auth not checked yet — blank screen (very fast, no flash)
  if (!authChecked) return null;

  // Not logged in — show login screen
  if (!session) return <LoginScreen />;

  // First load — minimal loading screen
  if (initialLoading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'DM Sans',sans-serif", flexDirection:"column", gap:12, color:"#6E6E6E" }}>
        <div style={{ fontSize:24, fontWeight:700, color:"#000" }}>mute.</div>
        <div style={{ fontSize:13 }}>Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'DM Sans',sans-serif", flexDirection:"column", gap:12, padding:24, textAlign:"center" }}>
        <div style={{ fontSize:16, fontWeight:700 }}>No se pudo cargar</div>
        <div style={{ fontSize:13, color:"#6E6E6E", maxWidth:400 }}>{error}</div>
        <button onClick={cargarTodo} style={{ padding:"10px 20px", borderRadius:6, border:"2px solid #FFF200", background:"#FFF200", fontWeight:700, cursor:"pointer" }}>Reintentar</button>
      </div>
    );
  }

  // Dashboard — stays mounted permanently, never unmounts during refreshes
  return (
    <DashboardShell
      inventory={inventory} setInventory={setInventory}
      ventas={ventas} setVentas={setVentas}
      gastos={gastos} setGastos={setGastos}
      onRefresh={cargarTodo}
      onSignOut={async () => { await signOut(); setSession(null); setInventory([]); setVentas([]); setGastos([]); }}
      userEmail={session.user.email}
      syncMsg={syncMsg}
      onSyncSheets={async () => { await sincronizarGoogleSheets(); await cargarTodo(); }}
    />
  );
}
