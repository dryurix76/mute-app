"use client";
import { useState, useEffect } from "react";
import { getInventario } from "../lib/inventarioApi";
import { getVentas } from "../lib/ventasApi";
import { getGastos } from "../lib/gastosApi";
import DashboardShell from "../components/DashboardShell";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);

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
    cargarTodo();
  }, []);

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
    />
  );
}
