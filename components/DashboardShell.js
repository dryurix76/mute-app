"use client";
import { useState, useEffect, useMemo } from "react";
import { Y, B, G1, G2 } from "../lib/constants";
import { buildStyles } from "../lib/styles";
import {
  crearPrendaInventario,
  actualizarPrendaInventario,
  borrarPrendaInventario,
} from "../lib/inventarioApi";
import {
  crearVenta,
  actualizarVenta,
  borrarVenta,
  subirComprobante,
} from "../lib/ventasApi";
import {
  crearGasto,
  actualizarGasto,
  borrarGasto,
  subirFactura,
} from "../lib/gastosApi";

import TabDashboard from "./tabs/TabDashboard";
import TabInventario from "./tabs/TabInventario";
import TabVentas from "./tabs/TabVentas";
import TabClientes from "./tabs/TabClientes";
import TabDelivery from "./tabs/TabDelivery";
import TabGastos from "./tabs/TabGastos";
import TabEstadisticas from "./tabs/TabEstadisticas";
import TabPerfil from "./tabs/TabPerfil";
import VentaFormModal from "./modals/VentaFormModal";
import InvFormModal from "./modals/InvFormModal";
import GastoFormModal from "./modals/GastoFormModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

export default function DashboardShell({
  inventory, setInventory,
  ventas, setVentas,
  gastos, setGastos,
  onRefresh,
}) {
  const [tab, setTab] = useState("dashboard");
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState("Cori");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(180);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [showInvForm, setShowInvForm] = useState(false);
  const [editInvId, setEditInvId] = useState(null);

  const [showGastoForm, setShowGastoForm] = useState(false);
  const [editGastoId, setEditGastoId] = useState(null);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = vw < 768;
  const isTablet = vw >= 768 && vw < 1100;
  const st = buildStyles({ isMobile, isTablet, sidebarOpen });

  const fmt = (usd) => {
    if (currency === "BS") return `Bs ${(usd * exchangeRate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}`;
    return `$${Number(usd).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  };

  const vendidas = ventas.map((v) => v.codigo);
  const disponibles = inventory.filter((i) => !vendidas.includes(i.codigo));
  const totalIngresos = ventas.reduce((s, v) => s + v.monto, 0);
  const margen = totalIngresos - ventas.length * 12.65;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "\ud83d\udcca" },
    { id: "inventario", label: "Inventario", icon: "\ud83d\udc55" },
    { id: "ventas", label: "Ventas", icon: "\ud83d\udcb3" },
    { id: "clientes", label: "Clientes", icon: "\ud83e\udd1d" },
    { id: "delivery", label: "Delivery", icon: "\ud83d\udef5" },
    { id: "gastos", label: "Gastos", icon: "\ud83e\uddfe" },
    { id: "estadisticas", label: "Estad\u00edsticas", icon: "\ud83d\udcc8" },
    { id: "perfil", label: "Perfil", icon: "\ud83d\udc64" },
  ];

  // --- Inventario CRUD (conectado a Supabase) ---
  async function handleGuardarInv(invForm) {
    setBusy(true);
    try {
      const modeloNombre = invForm.modeloNombre;
      if (editInvId) {
        const actualizado = await actualizarPrendaInventario(editInvId, { ...invForm, nombre: modeloNombre });
        setInventory((prev) => prev.map((i) => (i.id === editInvId ? { ...i, ...invForm, nombre: modeloNombre } : i)));
      } else {
        const creado = await crearPrendaInventario({ ...invForm, nombre: modeloNombre });
        setInventory((prev) => [...prev, { id: creado.id, codigo: creado.codigo, modelo: creado.modelo, nombre: creado.nombre, talla: creado.talla, drop: creado.drop_nombre, precio_costo: Number(creado.precio_costo), precio_venta: Number(creado.precio_venta) }]);
      }
      setShowInvForm(false);
    } catch (e) {
      alert("Error guardando la prenda: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteInv(id) {
    setBusy(true);
    try {
      await borrarPrendaInventario(id);
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      alert("Error borrando la prenda: " + e.message);
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  // --- Ventas CRUD (conectado a Supabase) ---
  async function handleGuardarVenta(form, compFile) {
    setBusy(true);
    try {
      let comprobanteUrl = null;
      if (compFile) comprobanteUrl = await subirComprobante(compFile);

      if (editId) {
        const actualizado = await actualizarVenta(editId, form, comprobanteUrl);
        setVentas((prev) => prev.map((v) => (v.id === editId ? actualizado : v)));
      } else {
        const item = inventory.find((i) => i.codigo === form.codigo);
        const creado = await crearVenta({ ...form, modelo: item?.modelo }, comprobanteUrl);
        setVentas((prev) => [creado, ...prev]);
      }
      setShowForm(false);
    } catch (e) {
      alert("Error guardando la venta: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteVenta(id) {
    setBusy(true);
    try {
      await borrarVenta(id);
      setVentas((prev) => prev.filter((v) => v.id !== id));
    } catch (e) {
      alert("Error borrando la venta: " + e.message);
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  // --- Gastos CRUD (conectado a Supabase) ---
  async function handleGuardarGasto(form, facturaFile) {
    setBusy(true);
    try {
      let facturaUrl = null;
      if (facturaFile) facturaUrl = await subirFactura(facturaFile);

      if (editGastoId) {
        const actualizado = await actualizarGasto(editGastoId, form, facturaUrl);
        setGastos((prev) => prev.map((g) => (g.id === editGastoId ? actualizado : g)));
      } else {
        const creado = await crearGasto(form, facturaUrl);
        setGastos((prev) => [creado, ...prev]);
      }
      setShowGastoForm(false);
    } catch (e) {
      alert("Error guardando el gasto: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGasto(id) {
    setBusy(true);
    try {
      await borrarGasto(id);
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      alert("Error borrando el gasto: " + e.message);
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  function openNewVenta() { setEditId(null); setShowForm(true); }
  function openEditVenta(v) { setEditId(v.id); setShowForm(true); }
  function openNewInv() { setEditInvId(null); setShowInvForm(true); }
  function openEditInv(i) { setEditInvId(i.id); setShowInvForm(true); }
  function openNewGasto() { setEditGastoId(null); setShowGastoForm(true); }
  function openEditGasto(g) { setEditGastoId(g.id); setShowGastoForm(true); }

  const editingVenta = editId ? ventas.find((v) => v.id === editId) : null;
  const editingInv = editInvId ? inventory.find((i) => i.id === editInvId) : null;
  const editingGasto = editGastoId ? gastos.find((g) => g.id === editGastoId) : null;

  const sharedProps = {
    st, fmt, isMobile, isTablet,
    inventory, ventas, gastos,
    vendidas, disponibles, totalIngresos, margen,
    currentUser, currency, exchangeRate,
  };

  return (
    <div style={st.root}>
      {isMobile && sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 150 }} onClick={() => setSidebarOpen(false)} />
      )}

      <div style={st.sidebar}>
        <div style={st.logoBox}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "serif" }}>mute.</div>
            {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>\u00d7</button>}
          </div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 6, letterSpacing: "0.12em", textTransform: "uppercase" }}>C\u00e1psula 001</div>
        </div>
        <nav style={st.nav}>
          {navItems.map((n) => (
            <div key={n.id} style={st.navItem(tab === n.id)} onClick={() => { setTab(n.id); if (isMobile) setSidebarOpen(false); }}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #222" }}>
          {["Cori", "Adri"].map((v) => (
            <div key={v} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", opacity: currentUser === v ? 1 : 0.5 }} onClick={() => setCurrentUser(v)}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: Y, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: B }}>{v[0]}</div>
              <span style={{ fontSize: 12, color: currentUser === v ? "#fff" : "#aaa", fontWeight: currentUser === v ? 700 : 400 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={st.main}>
        <div style={st.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "1px solid #333", borderRadius: 6, color: "#fff", fontSize: 16, cursor: "pointer", padding: "6px 10px", lineHeight: 1 }}>\u2630</button>
            )}
            <div>
              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: "#fff" }}>{navItems.find((n) => n.id === tab)?.label}</div>
              {!isMobile && <div style={{ fontSize: 12, color: "#666" }}>mute. Temporada 2026</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexWrap: "wrap", justifyContent: isMobile ? "flex-end" : "normal" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1a1a1a", borderRadius: 6, padding: "4px 6px" }}>
              <button style={{ padding: "5px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: currency === "USD" ? Y : "transparent", color: currency === "USD" ? B : "#aaa" }} onClick={() => setCurrency("USD")}>USD $</button>
              <button style={{ padding: "5px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: currency === "BS" ? Y : "transparent", color: currency === "BS" ? B : "#aaa" }} onClick={() => setCurrency("BS")}>Bs</button>
              {currency === "BS" && <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value) || 0)} style={{ width: 60, padding: "4px 6px", borderRadius: 4, border: "none", fontSize: 11, background: "#333", color: "#fff" }} />}
            </div>
            <button onClick={onRefresh} title="Recargar datos desde la base de datos" style={{ background: "none", border: "1px solid #333", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", padding: "6px 10px" }}>\u21bb</button>
            <button style={st.btn(true)} onClick={openNewVenta}>{isMobile ? "+ Venta" : "+ Registrar Venta"}</button>
          </div>
        </div>

        <div style={st.content}>
          {busy && (
            <div style={{ position: "fixed", top: 70, right: 20, background: "#000", color: "#FFF200", padding: "8px 16px", borderRadius: 8, fontSize: 12, zIndex: 500 }}>
              Guardando...
            </div>
          )}

          {tab === "dashboard" && <TabDashboard {...sharedProps} />}
          {tab === "inventario" && (
            <TabInventario {...sharedProps} onNew={openNewInv} onEdit={openEditInv} onDelete={(i) => setConfirmDelete({ type: "inventario", id: i.id, label: "\u00bfEliminar esta prenda del inventario?" })} />
          )}
          {tab === "ventas" && (
            <TabVentas {...sharedProps} onEdit={openEditVenta} onDelete={(v) => setConfirmDelete({ type: "venta", id: v.id, label: "\u00bfEliminar esta venta?" })} />
          )}
          {tab === "clientes" && <TabClientes {...sharedProps} />}
          {tab === "delivery" && <TabDelivery {...sharedProps} />}
          {tab === "gastos" && (
            <TabGastos {...sharedProps} onNew={openNewGasto} onEdit={openEditGasto} onDelete={(g) => setConfirmDelete({ type: "gasto", id: g.id, label: "\u00bfEliminar este gasto?" })} />
          )}
          {tab === "estadisticas" && <TabEstadisticas {...sharedProps} />}
          {tab === "perfil" && <TabPerfil {...sharedProps} currentUser={currentUser} setCurrentUser={setCurrentUser} currency={currency} setCurrency={setCurrency} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} />}
        </div>
      </div>

      {showForm && (
        <VentaFormModal
          st={st} inventory={inventory} vendidas={vendidas}
          initialVenta={editingVenta} isEdit={!!editId}
          onClose={() => setShowForm(false)}
          onSave={handleGuardarVenta}
        />
      )}

      {showInvForm && (
        <InvFormModal
          st={st} initialItem={editingInv} isEdit={!!editInvId}
          onClose={() => setShowInvForm(false)}
          onSave={handleGuardarInv}
        />
      )}

      {showGastoForm && (
        <GastoFormModal
          st={st} initialGasto={editingGasto} isEdit={!!editGastoId}
          onClose={() => setShowGastoForm(false)}
          onSave={handleGuardarGasto}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          st={st} label={confirmDelete.label}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete.type === "venta") handleDeleteVenta(confirmDelete.id);
            if (confirmDelete.type === "inventario") handleDeleteInv(confirmDelete.id);
            if (confirmDelete.type === "gasto") handleDeleteGasto(confirmDelete.id);
          }}
        />
      )}
    </div>
  );
}
