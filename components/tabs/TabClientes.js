"use client";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { G1, G2, MODELOS, PAGOS, PLATAFORMAS, EDAD_BRACKETS, edadBracket } from "../../lib/constants";

export default function TabClientes({ st, fmt, ventas }) {
  const [search, setSearch] = useState("");
  const [filterEdad, setFilterEdad] = useState("all");
  const [filterPago, setFilterPago] = useState("all");
  const [filterPlataforma, setFilterPlataforma] = useState("all");

  const clientes = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      const key = (v.correo && v.correo.trim()) || (v.telefono && v.telefono.trim()) || v.comprador;
      if (!map[key]) {
        map[key] = {
          id: key, nombre: v.comprador, telefono: v.telefono || "", correo: v.correo || "",
          ciudad: v.ciudad || "", edad: v.edad || "", compras: 0, totalGastado: 0, itemsComprados: 0,
          pagos: new Set(), plataformas: new Set(), modelos: new Set(),
          primeraCompra: v.fecha, ultimaCompra: v.fecha,
        };
      }
      const c = map[key];
      c.compras += 1;
      c.totalGastado += v.monto;
      c.itemsComprados += v.items || 1;
      c.pagos.add(v.pago);
      c.plataformas.add(v.plataforma);
      const modeloNombre = MODELOS.find((m) => m.id === v.modelo)?.nombre;
      if (modeloNombre) c.modelos.add(modeloNombre);
      if (v.fecha < c.primeraCompra) c.primeraCompra = v.fecha;
      if (v.fecha > c.ultimaCompra) c.ultimaCompra = v.fecha;
      if (v.telefono) c.telefono = v.telefono;
      if (v.correo) c.correo = v.correo;
      if (v.ciudad) c.ciudad = v.ciudad;
      if (v.edad) c.edad = v.edad;
    });
    return Object.values(map).map((c) => ({ ...c, pagos: Array.from(c.pagos), plataformas: Array.from(c.plataformas), modelos: Array.from(c.modelos) }));
  }, [ventas]);

  const filteredClientes = useMemo(() => clientes.filter((c) => {
    if (filterEdad !== "all" && edadBracket(c.edad) !== filterEdad) return false;
    if (filterPago !== "all" && !c.pagos.includes(filterPago)) return false;
    if (filterPlataforma !== "all" && !c.plataformas.includes(filterPlataforma)) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [c.nombre, c.telefono, c.correo, c.ciudad, c.edad, ...c.modelos].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.totalGastado - a.totalGastado), [clientes, search, filterEdad, filterPago, filterPlataforma]);

  const filtersActive = search || filterEdad !== "all" || filterPago !== "all" || filterPlataforma !== "all";
  const clearFilters = () => { setSearch(""); setFilterEdad("all"); setFilterPago("all"); setFilterPlataforma("all"); };
  const clientesRecurrentes = clientes.filter((c) => c.compras > 1).length;
  const ticketPromedio = clientes.length ? clientes.reduce((s, c) => s + c.totalGastado, 0) / clientes.length : 0;

  function exportExcel() {
    const rows = filteredClientes.map((c) => ({
      Cliente: c.nombre, Telefono: c.telefono, Correo: c.correo, Edad: c.edad, Ciudad: c.ciudad,
      Compras: c.compras, Items: c.itemsComprados, "Total Gastado": c.totalGastado,
      "Metodos de Pago": c.pagos.join(", "), Plataformas: c.plataformas.join(", "),
      Modelos: c.modelos.join(", "), "Primera Compra": c.primeraCompra, "Ultima Compra": c.ultimaCompra,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, `mute_clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPDF() {
    const rows = filteredClientes.map((c) => `<tr><td>${c.nombre}</td><td>${c.telefono || "—"}</td><td>${c.correo || "—"}</td><td>${c.edad || "—"}</td><td>${c.compras}</td><td>$${c.totalGastado}</td></tr>`).join("");
    const total = filteredClientes.reduce((s, c) => s + c.totalGastado, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>mute. Clientes</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#000;color:#FFF200}tfoot td{font-weight:bold;background:#f5f5f0}</style></head><body><h1>mute. — Reporte de Clientes</h1><table><thead><tr><th>Cliente</th><th>Tel</th><th>Correo</th><th>Edad</th><th>Compras</th><th>Total</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="5">TOTAL</td><td>$${total}</td></tr></tfoot></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  return (
    <div>
      <div style={{ ...st.statsRow, marginBottom: 16 }}>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Total Clientes</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{clientes.length}</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Recurrentes</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{clientesRecurrentes}</div>
          <div style={{ fontSize: 12, color: G1 }}>{clientes.length ? Math.round((clientesRecurrentes / clientes.length) * 100) : 0}%</div>
        </div>
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Ticket Promedio</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(ticketPromedio)}</div>
        </div>
      </div>

      <div style={{ ...st.card, marginBottom: 16, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input style={{ ...st.inp, width: 260, flex: "none" }} placeholder="🔍 Buscar nombre, teléfono, correo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ ...st.sel, width: 150 }} value={filterEdad} onChange={(e) => setFilterEdad(e.target.value)}>
            <option value="all">Edad: Todas</option>
            {EDAD_BRACKETS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select style={{ ...st.sel, width: 160 }} value={filterPago} onChange={(e) => setFilterPago(e.target.value)}>
            <option value="all">Pago: Todos</option>
            {PAGOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ ...st.sel, width: 170 }} value={filterPlataforma} onChange={(e) => setFilterPlataforma(e.target.value)}>
            <option value="all">Plataforma: Todas</option>
            {PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {filtersActive && <button style={st.btnSm()} onClick={clearFilters}>✕ Limpiar</button>}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button style={st.btnSm()} onClick={exportExcel}>📊 Excel</button>
            <button style={st.btnSm()} onClick={exportPDF}>📄 PDF</button>
            <span style={{ fontSize: 13, color: G1 }}>{filteredClientes.length} de {clientes.length}</span>
          </div>
        </div>
      </div>

      {filteredClientes.length === 0 ? (
        <div style={{ ...st.card, textAlign: "center", padding: 24, color: G2 }}>
          {clientes.length === 0 ? "Aún no hay clientes (se generan automáticamente desde Ventas)." : "Sin resultados para los filtros aplicados."}
        </div>
      ) : (
        <div style={st.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Cliente", "Contacto", "Edad", "Ciudad", "Compras", "Items", "Total Gastado", "Métodos de Pago", "Última Compra"].map((h) => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredClientes.map((c) => (
                  <tr key={c.id}>
                    <td style={st.td}><strong>{c.nombre}</strong>{c.compras > 1 && <span style={{ ...st.PC, marginLeft: 6 }}>Recurrente</span>}</td>
                    <td style={st.td}>
                      {c.telefono && <div style={{ fontSize: 11 }}>{c.telefono}</div>}
                      {c.correo && <div style={{ fontSize: 11, color: G2 }}>{c.correo}</div>}
                    </td>
                    <td style={st.td}>{c.edad || "—"}</td>
                    <td style={st.td}>{c.ciudad || "—"}</td>
                    <td style={st.td}><strong>{c.compras}</strong></td>
                    <td style={st.td}>{c.itemsComprados}</td>
                    <td style={st.td}><strong>{fmt(c.totalGastado)}</strong></td>
                    <td style={st.td}><span style={{ fontSize: 11 }}>{c.pagos.join(", ")}</span></td>
                    <td style={{ ...st.td, color: G1, fontSize: 11 }}>{c.ultimaCompra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
