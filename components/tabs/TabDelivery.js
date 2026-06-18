"use client";
import { useMemo } from "react";
import { G1, G2, MODELOS, RIDERY_ESTADO_COLOR } from "../../lib/constants";

export default function TabDelivery({ st, fmt, ventas }) {
  const pedidosDelivery = useMemo(() => {
    return ventas.filter((v) => (v.delivery || "Local") === "Local").map((v) => ({
      ventaId: v.id, codigo: v.codigo, comprador: v.comprador, telefono: v.telefono, ciudad: v.ciudad,
      modelo: MODELOS.find((m) => m.id === v.modelo)?.nombre || "", fecha: v.fecha,
      proveedor: v.proveedorDelivery || "", trackingId: v.trackingId || "",
      costoDelivery: v.costoDelivery || 0,
      estado: v.trackingId ? "Conductor asignado" : "Sin solicitar",
    }));
  }, [ventas]);

  return (
    <div>
      <div style={{ ...st.card, marginBottom: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 20 }}>🛵</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Pedidos de delivery local</div>
          <div style={{ fontSize: 11, color: G1 }}>La gestión de tracking y estados en vivo con Ridery se conecta cuando tengan acceso a su API corporativa.</div>
        </div>
      </div>

      <div style={{ ...st.statsRow, marginBottom: 16 }}>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Pedidos Locales</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{pedidosDelivery.length}</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Costo Total Delivery</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(pedidosDelivery.reduce((s, p) => s + (p.costoDelivery || 0), 0))}</div>
        </div>
      </div>

      {pedidosDelivery.length === 0 ? (
        <div style={{ ...st.card, textAlign: "center", padding: 24, color: G2 }}>
          No hay pedidos de delivery local. Marca una venta con Delivery = "Local" para que aparezca aquí.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pedidosDelivery.map((p) => {
            const colorEstado = RIDERY_ESTADO_COLOR[p.estado] || { bg: "#f0f0ec", text: G1 };
            return (
              <div key={p.ventaId} style={st.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14 }}>{p.comprador}</strong>
                  <code style={{ fontSize: 11, background: "#f5f5f0", padding: "2px 6px", borderRadius: 4 }}>{p.codigo}</code>
                  <span style={{ borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "3px 10px", background: colorEstado.bg, color: colorEstado.text }}>{p.estado}</span>
                </div>
                <div style={{ fontSize: 12, color: G1 }}>{p.modelo} · {p.ciudad || "Sin ciudad"} · {p.telefono || "Sin teléfono"} · {p.fecha}</div>
                {p.trackingId && <div style={{ fontSize: 12, color: G1, marginTop: 4 }}>Tracking: <strong>{p.trackingId}</strong> {p.proveedor && `· ${p.proveedor}`}</div>}
                {p.costoDelivery > 0 && <div style={{ fontSize: 12, color: G1, marginTop: 2 }}>Costo: <strong>{fmt(p.costoDelivery)}</strong></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
