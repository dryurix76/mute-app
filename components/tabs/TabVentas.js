"use client";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { G1, G2, MODELOS, PAGOS, PLATAFORMAS_FILTRO, REFERIDOS_FILTRO, DELIVERY } from "../../lib/constants";

export default function TabVentas({ st, fmt, ventas, totalIngresos, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterVendedora, setFilterVendedora] = useState("all");
  const [filterPlataforma, setFilterPlataforma] = useState("all");
  const [filterPago, setFilterPago] = useState("all");
  const [filterReferido, setFilterReferido] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredVentas = useMemo(() => ventas.filter((v) => {
    if (filterVendedora !== "all" && v.vendedora !== filterVendedora) return false;
    if (filterPlataforma !== "all" && v.plataforma !== filterPlataforma) return false;
    if (filterPago !== "all" && v.pago !== filterPago) return false;
    if (filterReferido !== "all" && (v.referido || "Sin referido") !== filterReferido) return false;
    if (filterDelivery !== "all" && (v.delivery || "Local") !== filterDelivery) return false;
    if (dateFrom && v.fecha < dateFrom) return false;
    if (dateTo && v.fecha > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [v.codigo, v.comprador, v.telefono, v.correo, v.ciudad, v.vendedora, v.plataforma, v.pago, v.referido, v.fecha, String(v.monto), v.notas, MODELOS.find((m) => m.id === v.modelo)?.nombre].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }), [ventas, search, filterVendedora, filterPlataforma, filterPago, filterReferido, filterDelivery, dateFrom, dateTo]);

  const filtersActive = search || filterVendedora !== "all" || filterPlataforma !== "all" || filterPago !== "all" || filterReferido !== "all" || filterDelivery !== "all" || dateFrom || dateTo;
  const clearFilters = () => { setSearch(""); setFilterVendedora("all"); setFilterPlataforma("all"); setFilterPago("all"); setFilterReferido("all"); setFilterDelivery("all"); setDateFrom(""); setDateTo(""); };

  function exportExcel() {
    const rows = filteredVentas.map((v) => ({
      Codigo: v.codigo, Modelo: MODELOS.find((m) => m.id === v.modelo)?.nombre || "",
      Comprador: v.comprador, Telefono: v.telefono, Correo: v.correo, Ciudad: v.ciudad, Edad: v.edad,
      Vendedora: v.vendedora, Fecha: v.fecha, Plataforma: v.plataforma, "Metodo de Pago": v.pago,
      Items: v.items || 1, Referencia: v.referencia || "", Referido: v.referido,
      Delivery: v.delivery || "Local", "Proveedor Delivery": v.proveedorDelivery || "",
      "ID Tracking": v.trackingId || "", "Costo Delivery": v.costoDelivery || 0, Monto: v.monto,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `mute_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPDF() {
    const rows = filteredVentas.map((v) => `<tr><td>${v.codigo}</td><td>${MODELOS.find((m) => m.id === v.modelo)?.nombre || ""}</td><td>${v.comprador}</td><td>${v.vendedora}</td><td>${v.plataforma}</td><td>${v.pago}</td><td>${v.items || 1}</td><td>${v.fecha}</td><td>$${v.monto}</td></tr>`).join("");
    const total = filteredVentas.reduce((s, v) => s + v.monto, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>mute. Ventas</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#000;color:#FFF200;text-transform:uppercase;font-size:10px}tfoot td{font-weight:bold;background:#f5f5f0}</style></head><body><h1>mute. — Reporte de Ventas</h1><p>${filteredVentas.length} ventas</p><table><thead><tr><th>Código</th><th>Modelo</th><th>Comprador</th><th>Vendedora</th><th>Plataforma</th><th>Pago</th><th>Items</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="8">TOTAL</td><td>$${total}</td></tr></tfoot></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 14, color: G1 }}>
          {filteredVentas.length} de {ventas.length} ventas &nbsp;·&nbsp; <strong>{fmt(filteredVentas.reduce((s, v) => s + v.monto, 0))}</strong> {filtersActive ? "filtrado" : "total"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={st.btnSm()} onClick={exportExcel}>📊 Exportar Excel</button>
          <button style={st.btnSm()} onClick={exportPDF}>📄 Exportar PDF</button>
        </div>
      </div>

      <div style={{ ...st.statsRow, marginBottom: 16 }}>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Total Ventas (filtro)</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(filteredVentas.reduce((s, v) => s + v.monto, 0))}</div>
          <div style={{ fontSize: 12, color: G1 }}>{filteredVentas.reduce((s, v) => s + (v.items || 1), 0)} items vendidos</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Total Ventas (general)</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(totalIngresos)}</div>
          <div style={{ fontSize: 12, color: G1 }}>{ventas.reduce((s, v) => s + (v.items || 1), 0)} items · {ventas.length} ventas</div>
        </div>
      </div>

      <div style={{ ...st.card, marginBottom: 16, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <input style={{ ...st.inp, width: 260, flex: "none" }} placeholder="🔍 Buscar comprador, código, teléfono, correo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ ...st.sel, width: 140 }} value={filterVendedora} onChange={(e) => setFilterVendedora(e.target.value)}>
            <option value="all">Vendedora: Todas</option>
            <option value="Cori">Cori</option>
            <option value="Adri">Adri</option>
          </select>
          <select style={{ ...st.sel, width: 150 }} value={filterPlataforma} onChange={(e) => setFilterPlataforma(e.target.value)}>
            <option value="all">Plataforma: Todas</option>
            {PLATAFORMAS_FILTRO.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ ...st.sel, width: 150 }} value={filterPago} onChange={(e) => setFilterPago(e.target.value)}>
            <option value="all">Pago: Todos</option>
            {PAGOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ ...st.sel, width: 170 }} value={filterReferido} onChange={(e) => setFilterReferido(e.target.value)}>
            <option value="all">Referido: Todos</option>
            {REFERIDOS_FILTRO.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select style={{ ...st.sel, width: 160 }} value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value)}>
            <option value="all">Delivery: Todos</option>
            {DELIVERY.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: G1 }}>Desde</label>
            <input type="date" style={{ ...st.inp, width: 150 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: G1 }}>Hasta</label>
            <input type="date" style={{ ...st.inp, width: 150 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {filtersActive && <button style={st.btnSm()} onClick={clearFilters}>✕ Limpiar filtros</button>}
        </div>
      </div>

      {filteredVentas.length === 0 && (
        <div style={{ ...st.card, marginBottom: 16, textAlign: "center", padding: 24, color: G2 }}>
          {ventas.length === 0 ? "Aún no hay ventas registradas. Usa el botón \"+ Registrar Venta\"." : "Sin resultados para los filtros aplicados."}
        </div>
      )}

      {filteredVentas.length > 0 && (
        <div style={st.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Código", "Modelo", "Comprador", "Tel", "Vendedora", "Plataforma", "Pago", "Items", "Delivery", "Fecha", "Monto", "Comprobante", "Acciones"].map((h) => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredVentas.map((v) => (
                  <tr key={v.id}>
                    <td style={st.td}><code style={{ background: "#f5f5f0", padding: "2px 5px", borderRadius: 3, fontSize: 11 }}>{v.codigo}</code></td>
                    <td style={st.td}>{MODELOS.find((m) => m.id === v.modelo)?.nombre || "—"}</td>
                    <td style={st.td}>
                      <div style={{ fontWeight: 600 }}>{v.comprador}</div>
                      {v.correo && <div style={{ fontSize: 11, color: G2 }}>{v.correo}</div>}
                    </td>
                    <td style={st.td}><span style={{ whiteSpace: "nowrap" }}>{v.telefono || "—"}</span></td>
                    <td style={st.td}>{v.vendedora}</td>
                    <td style={st.td}>{v.plataforma}</td>
                    <td style={st.td}><span style={{ whiteSpace: "nowrap" }}>{v.pago}</span></td>
                    <td style={st.td}><strong>{v.items || 1}</strong></td>
                    <td style={st.td}><span style={st.deliveryBadge(v.delivery || "Local")}>{v.delivery || "Local"}</span></td>
                    <td style={{ ...st.td, color: G1, fontSize: 11, whiteSpace: "nowrap" }}>{v.fecha}</td>
                    <td style={st.td}><strong>{fmt(v.monto)}</strong></td>
                    <td style={st.td}>{v.comprobante ? <a href={v.comprobante} target="_blank" rel="noreferrer" style={{ color: "#000", fontSize: 12, textDecoration: "underline" }}>Ver 📎</a> : <span style={{ color: "#ccc", fontSize: 11 }}>—</span>}</td>
                    <td style={st.td}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button style={{ ...st.btnSm(), fontSize: 13, padding: "3px 8px" }} onClick={() => onEdit(v)}>✏️</button>
                        <button style={{ ...st.btnSm("#fee"), fontSize: 13, padding: "3px 8px" }} onClick={() => onDelete(v)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...st.td, fontWeight: 700 }} colSpan={7}>TOTAL ({filteredVentas.length} ventas)</td>
                  <td style={{ ...st.td, fontWeight: 700 }}>{filteredVentas.reduce((s, v) => s + (v.items || 1), 0)}</td>
                  <td style={st.td} colSpan={2}></td>
                  <td style={{ ...st.td, fontWeight: 700, fontSize: 14 }}>{fmt(filteredVentas.reduce((s, v) => s + v.monto, 0))}</td>
                  <td style={st.td} colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
