"use client";
import { G1, G2 } from "../../lib/constants";

export default function TabGastos({ st, fmt, gastos, totalIngresos, onNew, onEdit, onDelete }) {
  const totalGastos = gastos.reduce((s, g) => s + g.cantidad, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 14, color: G1 }}>{gastos.length} gastos registrados</div>
        <button style={st.btn(true)} onClick={onNew}>+ Registrar Gasto</button>
      </div>

      <div style={{ ...st.statsRow, marginBottom: 16 }}>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Total Gastos</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(totalGastos)}</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Ingresos - Gastos</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(totalIngresos - totalGastos)}</div>
        </div>
      </div>

      <div style={st.card}>
        {gastos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: G2 }}>No hay gastos registrados.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Fecha", "Proveedor", "Concepto", "Cantidad", "Pago", "Factura", "Acciones"].map((h) => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td style={{ ...st.td, color: G1, fontSize: 11, whiteSpace: "nowrap" }}>{g.fecha}</td>
                    <td style={st.td}><strong>{g.proveedor}</strong></td>
                    <td style={st.td}><span style={st.PC}>{g.concepto}</span></td>
                    <td style={st.td}><strong>{fmt(g.cantidad)}</strong></td>
                    <td style={st.td}>{g.pago}</td>
                    <td style={st.td}>{g.factura ? <a href={g.factura} target="_blank" rel="noreferrer">Ver 📎</a> : <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={st.td}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button style={{ ...st.btnSm(), fontSize: 13, padding: "3px 8px" }} onClick={() => onEdit(g)}>✏️</button>
                        <button style={{ ...st.btnSm("#fee"), fontSize: 13, padding: "3px 8px" }} onClick={() => onDelete(g)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td style={{ ...st.td, fontWeight: 700 }} colSpan={3}>TOTAL</td><td style={{ ...st.td, fontWeight: 700 }}>{fmt(totalGastos)}</td><td style={st.td} colSpan={3}></td></tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
