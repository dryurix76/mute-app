"use client";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { G1, G2, MODELOS, PAGOS, PLATAFORMAS_FILTRO, DELIVERY } from "../../lib/constants";

export default function TabVentas({ st, fmt, ventas, totalIngresos, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterVendedora, setFilterVendedora] = useState("all");
  const [filterPlataforma, setFilterPlataforma] = useState("all");
  const [filterPago, setFilterPago] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const filteredVentas = useMemo(() => ventas.filter((v) => {
    if (filterVendedora !== "all" && v.vendedora !== filterVendedora) return false;
    if (filterPlataforma !== "all" && v.plataforma !== filterPlataforma) return false;
    if (filterPago !== "all" && v.pago !== filterPago) return false;
    if (filterDelivery !== "all" && (v.delivery || "Local") !== filterDelivery) return false;
    if (dateFrom && v.fecha < dateFrom) return false;
    if (dateTo && v.fecha > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [v.codigo, v.comprador, v.telefono, v.correo, v.ciudad, v.vendedora, v.plataforma, v.pago, v.referido, v.fecha, String(v.monto), v.notas, MODELOS.find((m) => m.id === v.modelo)?.nombre].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }), [ventas, search, filterVendedora, filterPlataforma, filterPago, filterDelivery, dateFrom, dateTo]);

  const filtersActive = search || filterVendedora !== "all" || filterPlataforma !== "all" || filterPago !== "all" || filterDelivery !== "all" || dateFrom || dateTo;
  const clearFilters = () => { setSearch(""); setFilterVendedora("all"); setFilterPlataforma("all"); setFilterPago("all"); setFilterDelivery("all"); setDateFrom(""); setDateTo(""); };

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

      {/* Barra de selección múltiple */}
      {seleccionados.size > 0 && (
        <div style={{ background:"#000", borderRadius:10, padding:"10px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ color:"#FFF200", fontWeight:700, fontSize:13 }}>{seleccionados.size} seleccionada{seleccionados.size>1?"s":""}</span>
          <button style={{ padding:"6px 14px", borderRadius:6, border:"none", background:"#FFF200", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer" }}
            onClick={() => setSeleccionados(new Set())}>Deseleccionar todo</button>
          {!confirmBulkDelete ? (
            <button style={{ padding:"6px 14px", borderRadius:6, border:"1px solid #ef4444", background:"none", color:"#ef4444", fontSize:12, fontWeight:700, cursor:"pointer" }}
              onClick={() => setConfirmBulkDelete(true)}>🗑️ Eliminar seleccionadas</button>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#fca5a5", fontSize:12 }}>¿Confirmas eliminar {seleccionados.size} venta{seleccionados.size>1?"s":""}?</span>
              <button style={{ padding:"6px 14px", borderRadius:6, border:"none", background:"#ef4444", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}
                onClick={() => { seleccionados.forEach(id => onDelete(id)); setSeleccionados(new Set()); setConfirmBulkDelete(false); }}>Sí, eliminar</button>
              <button style={{ padding:"6px 14px", borderRadius:6, border:"1px solid #666", background:"none", color:"#ccc", fontSize:12, cursor:"pointer" }}
                onClick={() => setConfirmBulkDelete(false)}>Cancelar</button>
            </div>
          )}
        </div>
      )}

      {filteredVentas.length === 0 && (
        <div style={{ ...st.card, marginBottom: 16, textAlign: "center", padding: 24, color: G2 }}>
          {ventas.length === 0 ? "Aún no hay ventas registradas. Usa el botón \"+ Registrar Venta\"." : "Sin resultados para los filtros aplicados."}
        </div>
      )}

      {filteredVentas.length > 0 && (
        <div style={st.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...st.th, width:36 }}>
                    <input type="checkbox"
                      checked={seleccionados.size === filteredVentas.length && filteredVentas.length > 0}
                      onChange={e => setSeleccionados(e.target.checked ? new Set(filteredVentas.map(v=>v.id)) : new Set())}/>
                  </th>
                  {["Código","Modelo","Comprador","Tel","Vendedora","Plataforma","Pago","Items","Delivery","Fecha","Monto","Factura","Acciones"].map((h)=><th key={h} style={st.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredVentas.map((v) => {
                  const modelo = MODELOS.find((m)=>m.id===v.modelo)?.nombre||"";
                  function generarRecibo() {
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Recibo mute.</title>
<style>body{font-family:'Helvetica Neue',Arial,sans-serif;padding:40px;color:#000;max-width:500px;margin:auto}
.logo{font-size:28px;font-weight:700;margin-bottom:4px}.sub{font-size:12px;color:#666;margin-bottom:32px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0ec;font-size:13px}
.label{color:#666}.value{font-weight:600}.total{font-size:18px;font-weight:700;margin-top:16px;text-align:right}
.footer{margin-top:32px;font-size:11px;color:#999;text-align:center}</style></head>
<body>
<div class="logo">mute.</div>
<div class="sub">Recibo de compra · Cápsula 001</div>
${[["Código",v.codigo],["Modelo",modelo],["Comprador",v.comprador],["Teléfono",v.telefono||"—"],["Correo",v.correo||"—"],["Vendedora",v.vendedora],["Plataforma",v.plataforma],["Método de pago",v.pago],["Delivery",v.delivery||"Local"],["Fecha",v.fecha],["Items",v.items||1],["Referencia",v.referencia||"—"]].map(([l,val])=>`<div class="row"><span class="label">${l}</span><span class="value">${val}</span></div>`).join("")}
<div class="total">Total: $${v.monto}</div>
<div class="footer">Gracias por tu compra · mutethebrand.com · @mutethebrand</div>
</body></html>`;
                    const w = window.open("","_blank");
                    if(w){w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),300);}
                  }
                  async function enviarWhatsApp() {
                    const tel = v.telefono;
                    // Si hay teléfono y API configurada, enviar por Meta API
                    if (tel) {
                      try {
                        const res = await fetch("/api/whatsapp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            tipo: "recibo",
                            telefono: tel,
                            datos: {
                              comprador: v.comprador,
                              telefono: tel,
                              modelo,
                              talla: v.talla || "—",
                              codigo: v.codigo,
                              monto: v.monto,
                              pago: v.pago,
                              vendedora: v.vendedora,
                              fecha: v.fecha,
                            },
                          }),
                        });
                        const data = await res.json();
                        if (data.ok) {
                          alert(`✓ Recibo enviado por WhatsApp a ${v.comprador}`);
                          return;
                        }
                      } catch (e) {
                        console.warn("Meta API falló, usando WhatsApp Web:", e.message);
                      }
                    }
                    // Fallback: abrir WhatsApp Web
                    const telLimpio = (tel || "").replace(/\D/g, "");
                    const msg = encodeURIComponent(`Hola ${v.comprador}! 👋 Aquí está tu recibo de compra en *mute.* 🖤\n\n📦 *${modelo}* (${v.codigo})\n💳 Pago: ${v.pago}\n📅 Fecha: ${v.fecha}\n💵 Total: $${v.monto}\n\n¡Gracias por tu compra! 🙌`);
                    window.open(telLimpio ? `https://wa.me/${telLimpio}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
                  }
                  function enviarCorreo() {
                    const asunto = encodeURIComponent(`Tu recibo de compra en mute. · ${v.codigo}`);
                    const cuerpo = encodeURIComponent(`Hola ${v.comprador},\n\nGracias por tu compra en mute.\n\nDetalles:\nProducto: ${modelo} (${v.codigo})\nPago: ${v.pago}\nFecha: ${v.fecha}\nTotal: $${v.monto}\n\n¡Hasta pronto!\nEquipo mute.`);
                    window.open(`mailto:${v.correo||""}?subject=${asunto}&body=${cuerpo}`);
                  }
                  return (
                  <tr key={v.id} style={{ background: seleccionados.has(v.id) ? "#fffbeb" : undefined }}>
                    <td style={{ ...st.td, width:36, textAlign:"center" }}>
                      <input type="checkbox" checked={seleccionados.has(v.id)}
                        onChange={e => { const s=new Set(seleccionados); e.target.checked?s.add(v.id):s.delete(v.id); setSeleccionados(s); }}/>
                    </td>
                    <td style={st.td}><code style={{ background:"#f5f5f0",padding:"2px 5px",borderRadius:3,fontSize:11 }}>{v.codigo}</code></td>
                    <td style={st.td}>{modelo||"—"}</td>
                    <td style={st.td}><div style={{ fontWeight:600 }}>{v.comprador}</div>{v.correo&&<div style={{ fontSize:11,color:G2 }}>{v.correo}</div>}</td>
                    <td style={st.td}><span style={{ whiteSpace:"nowrap" }}>{v.telefono||"—"}</span></td>
                    <td style={st.td}>{v.vendedora}</td>
                    <td style={st.td}>{v.plataforma}</td>
                    <td style={st.td}><span style={{ whiteSpace:"nowrap" }}>{v.pago}</span></td>
                    <td style={st.td}><strong>{v.items||1}</strong></td>
                    <td style={st.td}><span style={st.deliveryBadge(v.delivery||"Local")}>{v.delivery||"Local"}</span></td>
                    <td style={{ ...st.td,color:G1,fontSize:11,whiteSpace:"nowrap" }}>{v.fecha}</td>
                    <td style={st.td}><strong>{fmt(v.monto)}</strong></td>
                    <td style={st.td}>
                      <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                        <button title="Ver recibo PDF" style={{ ...st.btnSm(),fontSize:12,padding:"3px 7px" }} onClick={generarRecibo}>🧾</button>
                        <button title="Enviar por WhatsApp" style={{ ...st.btnSm(),fontSize:12,padding:"3px 7px",background:"#e8f5e8",borderColor:"#b8dcb8" }} onClick={enviarWhatsApp}>📱</button>
                        {v.correo&&<button title="Enviar por correo" style={{ ...st.btnSm(),fontSize:12,padding:"3px 7px",background:"#e8eefc",borderColor:"#b8c8f8" }} onClick={enviarCorreo}>✉️</button>}
                      </div>
                    </td>
                    <td style={st.td}>
                      <div style={{ display:"flex",gap:4 }}>
                        <button style={{ ...st.btnSm(),fontSize:13,padding:"3px 8px" }} onClick={()=>onEdit(v)}>✏️</button>
                        <button style={{ ...st.btnSm("#fee"),fontSize:13,padding:"3px 8px" }} onClick={()=>onDelete(v)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
