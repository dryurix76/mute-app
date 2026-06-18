"use client";
import { useState } from "react";
import {
  VENDEDORAS, PLATAFORMAS, PAGOS, REFERIDOS, DELIVERY,
  DELIVERY_PROVIDERS, ACCEPT, emptyVentaForm,
} from "../../lib/constants";

export default function VentaFormModal({ st, inventory, vendidas, initialVenta, isEdit, onClose, onSave }) {
  const [form, setForm] = useState(() => initialVenta ? {
    codigo: initialVenta.codigo, comprador: initialVenta.comprador, telefono: initialVenta.telefono || "",
    correo: initialVenta.correo || "", ciudad: initialVenta.ciudad || "", edad: initialVenta.edad || "",
    vendedora: initialVenta.vendedora, fecha: initialVenta.fecha, plataforma: initialVenta.plataforma,
    pago: initialVenta.pago, monto: initialVenta.monto, items: initialVenta.items || 1,
    referencia: initialVenta.referencia || "", referido: initialVenta.referido || "Sin referido",
    delivery: initialVenta.delivery || "Local", proveedorDelivery: initialVenta.proveedorDelivery || "",
    trackingId: initialVenta.trackingId || "", costoDelivery: initialVenta.costoDelivery || 0,
    notas: initialVenta.notas || "",
  } : emptyVentaForm());
  const [compFile, setCompFile] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.codigo || !form.comprador) return;
    setSaving(true);
    await onSave(form, compFile);
    setSaving(false);
  }

  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={st.modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? "Editar Venta" : "Registrar Venta"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={st.fLabel}>Código *</label>
          <select style={st.sel} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })}>
            <option value="">Seleccionar...</option>
            {inventory.filter((i) => !vendidas.includes(i.codigo) || i.codigo === form.codigo).map((i) => (
              <option key={i.codigo} value={i.codigo}>{i.codigo} — {i.nombre} {i.talla}</option>
            ))}
          </select>
        </div>

        <div style={st.fGrid}>
          <div><label style={st.fLabel}>Nombre *</label><input style={st.inp} value={form.comprador} onChange={(e) => setForm({ ...form, comprador: e.target.value })} /></div>
          <div><label style={st.fLabel}>Teléfono</label><input style={st.inp} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
          <div><label style={st.fLabel}>Correo</label><input type="email" style={st.inp} value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></div>
          <div><label style={st.fLabel}>Ciudad</label><input style={st.inp} value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
          <div><label style={st.fLabel}>Edad</label><input type="number" style={st.inp} value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} /></div>
          <div><label style={st.fLabel}>Vendedora</label><select style={st.sel} value={form.vendedora} onChange={(e) => setForm({ ...form, vendedora: e.target.value })}>{VENDEDORAS.map((v) => <option key={v}>{v}</option>)}</select></div>
          <div><label style={st.fLabel}>Fecha</label><input type="date" style={st.inp} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
          <div><label style={st.fLabel}>Plataforma</label><select style={st.sel} value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })}>{PLATAFORMAS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label style={st.fLabel}>Método de Pago</label><select style={st.sel} value={form.pago} onChange={(e) => setForm({ ...form, pago: e.target.value })}>{PAGOS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label style={st.fLabel}>Monto ($)</label><input type="number" style={st.inp} value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></div>
          <div><label style={st.fLabel}>Items</label><input type="number" min="1" style={st.inp} value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} /></div>
          <div><label style={st.fLabel}>Referido</label><select style={st.sel} value={form.referido} onChange={(e) => setForm({ ...form, referido: e.target.value })}>{REFERIDOS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label style={st.fLabel}>Delivery</label><select style={st.sel} value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })}>{DELIVERY.map((d) => <option key={d}>{d}</option>)}</select></div>
          {form.delivery === "Local" && (
            <>
              <div><label style={st.fLabel}>Proveedor Delivery</label><select style={st.sel} value={form.proveedorDelivery} onChange={(e) => setForm({ ...form, proveedorDelivery: e.target.value })}><option value="">Sin proveedor</option>{DELIVERY_PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></div>
              <div><label style={st.fLabel}>Costo Delivery ($)</label><input type="number" step="0.01" style={st.inp} value={form.costoDelivery} onChange={(e) => setForm({ ...form, costoDelivery: e.target.value })} /></div>
            </>
          )}
        </div>

        <div style={{ marginTop: 14, marginBottom: 14 }}>
          <label style={st.fLabel}>Comprobante (JPG, PNG, PDF, DOC)</label>
          <input type="file" accept={ACCEPT} onChange={(e) => setCompFile(e.target.files[0])} style={{ ...st.inp, padding: "7px 12px" }} />
          {compFile && <div style={{ fontSize: 11, marginTop: 4 }}>📎 {compFile.name}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={st.fLabel}>Notas</label>
          <textarea style={{ ...st.inp, height: 60 }} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button style={st.btn(false)} onClick={onClose}>Cancelar</button>
          <button style={st.btn(true)} onClick={handleSave} disabled={!form.codigo || !form.comprador || saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Registrar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
