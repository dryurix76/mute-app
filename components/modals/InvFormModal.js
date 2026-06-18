"use client";
import { useState } from "react";
import { MODELOS, TALLAS, emptyInvForm } from "../../lib/constants";

export default function InvFormModal({ st, initialItem, isEdit, onClose, onSave }) {
  const [form, setForm] = useState(() => initialItem ? {
    codigo: initialItem.codigo, modelo: initialItem.modelo, talla: initialItem.talla,
    drop: initialItem.drop || "DROP 001", precio_costo: initialItem.precio_costo, precio_venta: initialItem.precio_venta,
  } : emptyInvForm());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.codigo) return;
    setSaving(true);
    const modeloNombre = MODELOS.find((m) => m.id === form.modelo)?.nombre || form.modelo;
    await onSave({ ...form, modeloNombre });
    setSaving(false);
  }

  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...st.modal, width: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? "Editar Prenda" : "Agregar Prenda"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={st.fGrid}>
          <div><label style={st.fLabel}>Código *</label><input style={st.inp} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: MC21" /></div>
          <div><label style={st.fLabel}>Modelo</label><select style={st.sel} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}>{MODELOS.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
          <div><label style={st.fLabel}>Talla</label><select style={st.sel} value={form.talla} onChange={(e) => setForm({ ...form, talla: e.target.value })}>{TALLAS.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label style={st.fLabel}>Drop</label><input style={st.inp} value={form.drop} onChange={(e) => setForm({ ...form, drop: e.target.value })} /></div>
          <div><label style={st.fLabel}>Precio Costo ($)</label><input type="number" step="0.01" style={st.inp} value={form.precio_costo} onChange={(e) => setForm({ ...form, precio_costo: e.target.value })} /></div>
          <div><label style={st.fLabel}>Precio Venta ($)</label><input type="number" step="0.01" style={st.inp} value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={st.btn(false)} onClick={onClose}>Cancelar</button>
          <button style={st.btn(true)} onClick={handleSave} disabled={!form.codigo || saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Agregar Prenda"}
          </button>
        </div>
      </div>
    </div>
  );
}
