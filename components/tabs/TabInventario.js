"use client";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Y, G1, G2, MODELOS, TALLAS, PAGE_SIZES } from "../../lib/constants";

export default function TabInventario({ st, fmt, inventory, vendidas, disponibles, onNew, onEdit, onDelete }) {
  const [filterModelo, setFilterModelo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [invPage, setInvPage] = useState(1);
  const [invPerPage, setInvPerPage] = useState(20);

  const filteredInv = useMemo(() => inventory.filter((i) => {
    if (filterModelo !== "all" && i.modelo !== filterModelo) return false;
    const sold = vendidas.includes(i.codigo);
    if (filterStatus === "disponible" && sold) return false;
    if (filterStatus === "vendida" && !sold) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.codigo.toLowerCase().includes(q) && !i.nombre.toLowerCase().includes(q) && !i.talla.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [inventory, vendidas, filterModelo, filterStatus, search]);

  const effPerPage = invPerPage === "Todos" ? filteredInv.length || 1 : invPerPage;
  const totalPages = Math.ceil(filteredInv.length / effPerPage) || 1;
  const pageItems = filteredInv.slice((invPage - 1) * effPerPage, invPage * effPerPage);

  function exportInvExcel() {
    const rows = filteredInv.map((i) => ({
      Codigo: i.codigo, Modelo: i.nombre, Talla: i.talla, Drop: i.drop || "DROP 001",
      Status: vendidas.includes(i.codigo) ? "VENDIDA" : "DISPONIBLE",
      "Precio Costo": i.precio_costo, "Precio Venta": i.precio_venta,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `mute_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportInvPDF() {
    const rows = filteredInv.map((i) => `<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.talla}</td><td>${i.drop || "DROP 001"}</td><td>${vendidas.includes(i.codigo) ? "VENDIDA" : "DISPONIBLE"}</td><td>$${i.precio_costo}</td><td>$${i.precio_venta}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>mute. Inventario</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#000;color:#FFF200;text-transform:uppercase;font-size:10px}</style></head><body><h1>mute. — Reporte de Inventario</h1><p>${filteredInv.length} prendas</p><table><thead><tr><th>Código</th><th>Modelo</th><th>Talla</th><th>Drop</th><th>Status</th><th>P.Costo</th><th>P.Venta</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  return (
    <div>
      <div style={st.statsRow}>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total Prendas</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{inventory.length}</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Disponibles</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1a7a1a" }}>{disponibles.length}</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>No Disponibles</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#b30000" }}>{inventory.length - disponibles.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...st.inp, width: 240, flex: "none" }} placeholder="🔍 Buscar código, modelo, talla..." value={search} onChange={(e) => { setSearch(e.target.value); setInvPage(1); }} />
        <select style={{ ...st.sel, width: 180 }} value={filterModelo} onChange={(e) => { setFilterModelo(e.target.value); setInvPage(1); }}>
          <option value="all">Todos los modelos</option>
          {MODELOS.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select style={{ ...st.sel, width: 150 }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setInvPage(1); }}>
          <option value="all">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="vendida">Vendida</option>
        </select>
        <select style={{ ...st.sel, width: 130 }} value={invPerPage} onChange={(e) => { const v = e.target.value; setInvPerPage(v === "Todos" ? "Todos" : Number(v)); setInvPage(1); }}>
          {PAGE_SIZES.map((p) => <option key={p} value={p}>{p === "Todos" ? "Todos" : `${p} / página`}</option>)}
        </select>
        <span style={{ fontSize: 13, color: G1 }}>{filteredInv.length} resultados</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button style={st.btnSm()} onClick={exportInvExcel}>📊 Excel</button>
          <button style={st.btnSm()} onClick={exportInvPDF}>📄 PDF</button>
          <button style={st.btn(true)} onClick={onNew}>+ Agregar Prenda</button>
        </div>
      </div>

      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={st.sTitle}>Listado ({filteredInv.length})</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={{ ...st.btnSm(), padding: "4px 12px" }} onClick={() => setInvPage((p) => Math.max(1, p - 1))} disabled={invPage === 1}>‹</button>
            <span style={{ fontSize: 13, color: G1 }}>Pág {invPage}/{totalPages}</span>
            <button style={{ ...st.btnSm(), padding: "4px 12px" }} onClick={() => setInvPage((p) => Math.min(totalPages, p + 1))} disabled={invPage >= totalPages}>›</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Código", "Modelo", "Talla", "Drop", "Status", "P.Costo", "P.Venta", "Acciones"].map((h) => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
            <tbody>
              {pageItems.map((i) => {
                const sold = vendidas.includes(i.codigo);
                return (
                  <tr key={i.id}>
                    <td style={st.td}><code style={{ background: "#f5f5f0", padding: "2px 5px", borderRadius: 3 }}>{i.codigo}</code></td>
                    <td style={st.td}>{i.nombre}</td>
                    <td style={st.td}><strong>{i.talla}</strong></td>
                    <td style={st.td}>{i.drop || "DROP 001"}</td>
                    <td style={st.td}><span style={st.badge(sold)}>{sold ? "VENDIDA" : "DISPONIBLE"}</span></td>
                    <td style={st.td}>{fmt(i.precio_costo)}</td>
                    <td style={st.td}><strong>{fmt(i.precio_venta)}</strong></td>
                    <td style={st.td}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button style={{ ...st.btnSm(), fontSize: 13, padding: "3px 8px" }} onClick={() => onEdit(i)}>✏️</button>
                        <button style={{ ...st.btnSm("#fee"), fontSize: 13, padding: "3px 8px" }} onClick={() => onDelete(i)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInv.length === 0 && <div style={{ textAlign: "center", padding: 24, color: G2 }}>No hay prendas que coincidan con los filtros.</div>}
        </div>
      </div>
    </div>
  );
}
