"use client";
import { useState } from "react";
import { GASTO_PAGOS, GASTO_CONCEPTOS, ACCEPT, emptyGastoForm } from "../../lib/constants";

export default function GastoFormModal({ st, initialGasto, isEdit, onClose, onSave }) {
  const [form, setForm] = useState(() => initialGasto ? {
    fecha: initialGasto.fecha, proveedor: initialGasto.proveedor, concepto: initialGasto.concepto,
    cantidad: initialGasto.cantidad, pago: initialGasto.pago, notas: initialGasto.notas || "",
  } : emptyGastoForm());
  const [facturaFile, setFacturaFile] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.proveedor || !form.cantidad) return;
    setSaving(true);
    await onSave(form, facturaFile);
    setSaving(false);
  }

  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...st.modal, width: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? "Editar Gasto" : "Registrar Gasto"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={st.fGrid}>
          <div><label style={st.fLabel}>Fecha</label><input type="date" style={st.inp} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
          <div><label style={st.fLabel}>Proveedor *</label><input style={st.inp} value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} /></div>
          <div><label style={st.fLabel}>Concepto</label><select style={st.sel} value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })}>{GASTO_CONCEPTOS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label style={st.fLabel}>Cantidad ($) *</label><input type="number" step="0.01" style={st.inp} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} /></div>
          <div><label style={st.fLabel}>Método de Pago</label><select style={st.sel} value={form.pago} onChange={(e) => setForm({ ...form, pago: e.target.value })}>{GASTO_PAGOS.map((p) => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div style={{ marginTop: 14, marginBottom: 14 }}>
          <label style={st.fLabel}>Factura (JPG, PNG, PDF, DOC)</label>
          <input type="file" accept={ACCEPT} onChange={(e) => setFacturaFile(e.target.files[0])} style={{ ...st.inp, padding: "7px 12px" }} />
          {facturaFile && <div style={{ fontSize: 11, marginTop: 4 }}>📎 {facturaFile.name}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={st.fLabel}>Notas</label>
          <textarea style={{ ...st.inp, height: 60 }} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button style={st.btn(false)} onClick={onClose}>Cancelar</button>
          <button style={st.btn(true)} onClick={handleSave} disabled={!form.proveedor || !form.cantidad || saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Registrar Gasto"}
          </button>
        </div>
      </div>
    </div>
  );
}
