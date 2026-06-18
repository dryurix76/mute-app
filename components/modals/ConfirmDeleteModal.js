export default function ConfirmDeleteModal({ st, label, onCancel, onConfirm }) {
  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ ...st.modal, width: 380, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#6E6E6E", marginBottom: 24 }}>Esta acción no se puede deshacer.</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button style={st.btn(false)} onClick={onCancel}>Cancelar</button>
          <button style={{ ...st.btn(true), background: "#b30000", borderColor: "#b30000", color: "#fff" }} onClick={onConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
