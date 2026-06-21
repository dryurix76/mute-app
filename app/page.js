"use client";
import { useState, useEffect } from "react";
import { getInventario } from "../lib/inventarioApi";
import { getVentas } from "../lib/ventasApi";
import { getGastos } from "../lib/gastosApi";
import { getSession, onAuthChange, signOut } from "../lib/authApi";
import DashboardShell from "../components/DashboardShell";
import LoginScreen from "../components/LoginScreen";

export default function Page() {
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setAuthChecked(true);
    });
    const subscription = onAuthChange((s) => setSession(s));
    return () => subscription?.unsubscribe();
  }, []);

  async function sincronizarGoogleSheets() {
    setSyncMsg("Sincronizando con Google Sheets...");
    try {
      const res = await fetch("/api/sync-sheets", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSyncMsg(
          data.ventasNuevas > 0
            ? `${data.ventasNuevas} venta(s) nueva(s) importadas desde Google Sheets.`
            : "Sincronizado con Google Sheets — sin cambios nuevos."
        );
      } else {
        setSyncMsg("No se pudo sincronizar con Google Sheets: " + data.error);
      }
    } catch (e) {
      setSyncMsg("No se pudo sincronizar con Google Sheets.");
    } finally {
      setTimeout(() => setSyncMsg(""), 5000);
    }
  }

  async function cargarTodo() {
    setLoading(true);
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
      setError(
        "No se pudo conectar a la base de datos. Revisa las variables de entorno de Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      sincronizarGoogleSheets().then(() => cargarTodo());
    }
  }, [session]);

  if (!authChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#6E6E6E" }}>
        Verificando sesión...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onSuccess={() => {}} />;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#6E6E6E" }}>
        Cargando datos de mute...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>No se pudo cargar el dashboard</div>
        <div style={{ fontSize: 13, color: "#6E6E6E", maxWidth: 420 }}>{error}</div>
        <button onClick={cargarTodo} style={{ padding: "10px 20px", borderRadius: 6, border: "2px solid #FFF200", background: "#FFF200", fontWeight: 700, cursor: "pointer" }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <DashboardShell
      inventory={inventory}
      setInventory={setInventory}
      ventas={ventas}
      setVentas={setVentas}
      gastos={gastos}
      setGastos={setGastos}
      onRefresh={cargarTodo}
      onSignOut={async () => { await signOut(); setSession(null); }}
      userEmail={session.user.email}
      syncMsg={syncMsg}
      onSyncSheets={async () => { await sincronizarGoogleSheets(); await cargarTodo(); }}
    />
  );
}
