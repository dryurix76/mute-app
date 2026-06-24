"use client";
import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { G1, G2, MODELOS, PAGOS, PLATAFORMAS_FILTRO, PLATAFORMAS, EDAD_BRACKETS, edadBracket } from "../../lib/constants";

const PLAT_COLOR = { Instagram:"#e1306c", WhatsApp:"#25d366", Zelle:"#6600cc", Binance:"#f3ba2f", Zinli:"#00b4d8", Venmo:"#3d95ce", Cash:"#888", Otro:"#ccc" };

function Avatar({ nombre, size=36 }) {
  const initials = nombre ? nombre.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase() : "?";
  const colors = ["#3b82f6","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea","#16a34a"];
  const color = colors[(nombre?.charCodeAt(0)||0)%colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color+"22", border:`2px solid ${color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.36, fontWeight:700, color, flexShrink:0 }}>
      {initials}
    </div>
  );
}

export default function TabClientes({ st, fmt, ventas }) {
  const [search, setSearch] = useState("");
  const [filterEdad, setFilterEdad] = useState("all");
  const [filterPago, setFilterPago] = useState("all");
  const [filterPlataforma, setFilterPlataforma] = useState("all");
  const [vistaTab, setVistaTab] = useState("lista");
  const [editando, setEditando] = useState(null);
  const [clientesExtra, setClientesExtra] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newC, setNewC] = useState({ nombre:"", telefono:"", correo:"", ciudad:"", edad:"", plataforma:"Instagram" });
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef();

  const clientesDeVentas = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      const key = (v.correo?.trim())||(v.telefono?.trim())||v.comprador;
      if (!map[key]) {
        map[key] = { id:key, nombre:v.comprador, telefono:v.telefono||"", correo:v.correo||"", ciudad:v.ciudad||"", edad:v.edad||"", compras:0, totalGastado:0, pagos:new Set(), plataformas:new Set(), modelos:new Set(), primeraCompra:v.fecha, ultimaCompra:v.fecha, fromVentas:true };
      }
      const c = map[key];
      c.compras++; c.totalGastado+=v.monto;
      c.pagos.add(v.pago); c.plataformas.add(v.plataforma);
      const mn = MODELOS.find((m)=>m.id===v.modelo)?.nombre; if(mn)c.modelos.add(mn);
      if(v.fecha<c.primeraCompra)c.primeraCompra=v.fecha;
      if(v.fecha>c.ultimaCompra)c.ultimaCompra=v.fecha;
      if(v.telefono)c.telefono=v.telefono; if(v.correo)c.correo=v.correo;
    });
    return Object.values(map).map((c)=>({ ...c, pagos:Array.from(c.pagos), plataformas:Array.from(c.plataformas), modelos:Array.from(c.modelos) }));
  }, [ventas]);

  const clientes = useMemo(() => {
    const all = [...clientesDeVentas];
    clientesExtra.forEach((ce) => { if(!all.find((c)=>c.id===ce.id))all.push(ce); });
    return all;
  }, [clientesDeVentas, clientesExtra]);

  const filtered = useMemo(() => clientes.filter((c) => {
    if(filterEdad!=="all"&&edadBracket(c.edad)!==filterEdad)return false;
    if(filterPago!=="all"&&!(c.pagos||[]).includes(filterPago))return false;
    if(filterPlataforma!=="all"&&!(c.plataformas||[]).includes(filterPlataforma))return false;
    if(search){ const q=search.toLowerCase(); if(!`${c.nombre} ${c.telefono} ${c.correo} ${c.ciudad}`.toLowerCase().includes(q))return false; }
    return true;
  }).sort((a,b)=>(b.totalGastado||0)-(a.totalGastado||0)), [clientes,search,filterEdad,filterPago,filterPlataforma]);

  const recurrentes = clientes.filter(c=>c.compras>1).length;
  const ticketProm = clientes.length ? clientes.reduce((s,c)=>s+(c.totalGastado||0),0)/clientes.length : 0;
  const top = [...clientes].sort((a,b)=>(b.totalGastado||0)-(a.totalGastado||0)).slice(0,3);

  function handleExcelImport(e) {
    const file = e.target.files[0]; if(!file)return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type:"binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        let agregados = 0;
        rows.forEach((row, i) => {
          const nombre = row["Nombre"]||row["nombre"]||row["NOMBRE"]||row["Cliente"]||row["CLIENTE"]||"";
          if(!nombre.trim())return;
          const id = "excel_"+Date.now()+"_"+i;
          if(clientes.find(c=>c.nombre.toLowerCase()===nombre.toLowerCase().trim()))return;
          setClientesExtra(prev=>[...prev,{
            id, nombre:nombre.trim(),
            telefono:String(row["Telefono"]||row["Teléfono"]||row["TELEFONO"]||""),
            correo:String(row["Correo"]||row["Email"]||row["EMAIL"]||""),
            ciudad:String(row["Ciudad"]||row["CIUDAD"]||""),
            edad:String(row["Edad"]||row["EDAD"]||""),
            plataforma:String(row["Plataforma"]||row["PLATAFORMA"]||""),
            compras:0, totalGastado:0, pagos:[], plataformas:[], modelos:[], fromVentas:false,
          }]);
          agregados++;
        });
        setImportMsg(`✓ ${agregados} cliente(s) importados desde Excel`);
        setTimeout(()=>setImportMsg(""),4000);
      } catch {
        setImportMsg("Error al leer el archivo Excel");
        setTimeout(()=>setImportMsg(""),3000);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value="";
  }

  function exportExcel() {
    const rows = filtered.map(c=>({ Cliente:c.nombre, Telefono:c.telefono, Correo:c.correo, Edad:c.edad, Ciudad:c.ciudad, Compras:c.compras, "Total Gastado":c.totalGastado, Plataformas:(c.plataformas||[]).join(", "), "Metodos":(c.pagos||[]).join(", "), "Primera Compra":c.primeraCompra, "Ultima Compra":c.ultimaCompra }));
    const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Clientes"); XLSX.writeFile(wb,`mute_clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function addCliente() {
    if(!newC.nombre.trim())return;
    setClientesExtra(prev=>[...prev,{ id:"manual_"+Date.now(), ...newC, compras:0, totalGastado:0, pagos:[], plataformas:[newC.plataforma], modelos:[], fromVentas:false, primeraCompra:"—", ultimaCompra:"—" }]);
    setNewC({ nombre:"",telefono:"",correo:"",ciudad:"",edad:"",plataforma:"Instagram" }); setShowAddForm(false);
  }

  function deleteCliente(id) { setClientesExtra(prev=>prev.filter(c=>c.id!==id)); }
  function saveEdit(id, data) { setClientesExtra(prev=>prev.map(c=>c.id===id?{...c,...data}:c)); setEditando(null); }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header financiero */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Total clientes", val:clientes.length, sub:"base de clientes", color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
          { label:"Recurrentes", val:recurrentes, sub:`${clientes.length?Math.round(recurrentes/clientes.length*100):0}% del total`, color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
          { label:"Ticket promedio", val:fmt(ticketProm), sub:"por cliente", color:"#059669", bg:"#f0fdf4", border:"#bbf7d0" },
          { label:"Ingresos total", val:fmt(clientes.reduce((s,c)=>s+(c.totalGastado||0),0)), sub:"de todos los clientes", color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
        ].map(s=>(
          <div key={s.label} style={{ background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ fontSize:10, color:"#666", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontWeight:600 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Top clientes */}
      {top.length>0 && (
        <div style={{ background:"#fff", border:"1.5px solid #e5e5e0", borderRadius:14, padding:"18px 22px", marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>🏆 Top clientes</div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {top.map((c,i)=>(
              <div key={c.id} style={{ flex:"1 1 160px", display:"flex", alignItems:"center", gap:12, background:"#f9f9f6", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:18, fontWeight:700, color:["#f59e0b","#9ca3af","#cd7f32"][i] }}>{["🥇","🥈","🥉"][i]}</div>
                <Avatar nombre={c.nombre}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{c.nombre}</div>
                  <div style={{ fontSize:11, color:"#16a34a", fontWeight:600 }}>{fmt(c.totalGastado)}</div>
                  <div style={{ fontSize:10, color:"#888" }}>{c.compras} compra{c.compras>1?"s":""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", background:"#f0f0ec", borderRadius:10, padding:3, gap:2 }}>
          {[{id:"lista",label:"👥 Lista"},{id:"tarjetas",label:"🃏 Tarjetas"}].map(t=>(
            <button key={t.id} onClick={()=>setVistaTab(t.id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:vistaTab===t.id?700:400, background:vistaTab===t.id?"#fff":"transparent", color:vistaTab===t.id?"#000":"#888" }}>{t.label}</button>
          ))}
        </div>
        <input style={{ ...st.inp, flex:1, minWidth:200 }} placeholder="🔍 Buscar nombre, teléfono, correo..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{ ...st.sel, width:130 }} value={filterPlataforma} onChange={e=>setFilterPlataforma(e.target.value)}>
          <option value="all">Plataforma</option>
          {PLATAFORMAS_FILTRO.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select style={{ ...st.sel, width:110 }} value={filterPago} onChange={e=>setFilterPago(e.target.value)}>
          <option value="all">Pago</option>
          {PAGOS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
          <button style={st.btnSm()} onClick={exportExcel} title="Exportar Excel">📊</button>
          <label style={{ ...st.btnSm(), cursor:"pointer" }} title="Importar desde Excel">
            📥 Importar Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={handleExcelImport}/>
          </label>
          <button style={st.btn(true)} onClick={()=>setShowAddForm(true)}>+ Agregar</button>
        </div>
      </div>

      {importMsg && <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"8px 14px", fontSize:12, color:"#166534", marginBottom:12 }}>{importMsg}</div>}

      {showAddForm && (
        <div style={{ background:"#f9f9f6", border:"1.5px solid #e5e5e0", borderRadius:14, padding:"18px 22px", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Nuevo cliente</div>
          <div style={st.fGrid}>
            {[["nombre","Nombre *"],["telefono","Teléfono"],["correo","Correo"],["ciudad","Ciudad"],["edad","Edad"]].map(([k,l])=>(
              <div key={k}><label style={st.fLabel}>{l}</label><input style={st.inp} value={newC[k]} onChange={e=>setNewC({...newC,[k]:e.target.value})} type={k==="edad"?"number":"text"}/></div>
            ))}
            <div><label style={st.fLabel}>Plataforma</label><select style={st.sel} value={newC.plataforma} onChange={e=>setNewC({...newC,plataforma:e.target.value})}>{PLATAFORMAS.map(p=><option key={p}>{p}</option>)}</select></div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <button style={st.btn(true)} onClick={addCliente} disabled={!newC.nombre.trim()}>Guardar</button>
            <button style={st.btn(false)} onClick={()=>setShowAddForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ fontSize:12, color:G2, marginBottom:12 }}>{filtered.length} de {clientes.length} clientes</div>

      {/* Vista LISTA */}
      {vistaTab==="lista" && (
        <div style={{ background:"#fff", border:"1.5px solid #e5e5e0", borderRadius:14, overflow:"hidden" }}>
          {filtered.length===0 ? (
            <div style={{ textAlign:"center", padding:32, color:G2 }}>
              {clientes.length===0?"Los clientes aparecen aquí al registrar ventas.":"Sin resultados."}
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f9f9f6", borderBottom:"1px solid #e5e5e0" }}>
                    {["","Cliente","Plataforma","Contacto","Compras","Total","Última",""].map(h=>(
                      <th key={h} style={{ ...st.th, background:"transparent" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c,i)=>(
                    <tr key={c.id} style={{ borderBottom:"1px solid #f5f5f2" }}>
                      {editando===c.id ? (
                        <>
                          <td style={st.td}><Avatar nombre={c.nombre}/></td>
                          <td style={st.td}><input style={{ ...st.inp,width:130 }} defaultValue={c.nombre} id={`en_${c.id}`}/></td>
                          <td style={st.td}></td>
                          <td style={st.td}>
                            <input style={{ ...st.inp,width:120,marginBottom:4 }} defaultValue={c.telefono} id={`et_${c.id}`} placeholder="Tel"/>
                            <input style={{ ...st.inp,width:120 }} defaultValue={c.correo} id={`ec_${c.id}`} placeholder="Correo"/>
                          </td>
                          <td colSpan={3} style={st.td}></td>
                          <td style={st.td}>
                            <div style={{ display:"flex",gap:4 }}>
                              <button style={{ ...st.btnSm(),padding:"3px 8px" }} onClick={()=>saveEdit(c.id,{ nombre:document.getElementById(`en_${c.id}`)?.value||c.nombre, telefono:document.getElementById(`et_${c.id}`)?.value||c.telefono, correo:document.getElementById(`ec_${c.id}`)?.value||c.correo })}>✓</button>
                              <button style={{ ...st.btnSm("#fee"),padding:"3px 8px" }} onClick={()=>setEditando(null)}>✕</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ ...st.td,width:44,padding:"10px 8px" }}><Avatar nombre={c.nombre}/></td>
                          <td style={st.td}>
                            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                              <strong style={{ fontSize:13 }}>{c.nombre}</strong>
                              {c.compras>1&&<span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:20,background:"#eff6ff",color:"#3b82f6" }}>Recurrente</span>}
                            </div>
                            {c.edad&&<div style={{ fontSize:10,color:G2 }}>{c.edad} años</div>}
                            {c.ciudad&&<div style={{ fontSize:10,color:G2 }}>{c.ciudad}</div>}
                          </td>
                          <td style={st.td}>
                            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                              {(c.plataformas||[]).map(p=>(
                                <span key={p} style={{ fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:(PLAT_COLOR[p]||"#eee")+"22",color:PLAT_COLOR[p]||"#666" }}>{p}</span>
                              ))}
                            </div>
                          </td>
                          <td style={st.td}>
                            {c.telefono&&<div style={{ fontSize:11 }}>{c.telefono}</div>}
                            {c.correo&&<div style={{ fontSize:11,color:G2 }}>{c.correo}</div>}
                          </td>
                          <td style={{ ...st.td,textAlign:"center" }}><strong>{c.compras}</strong></td>
                          <td style={st.td}><strong style={{ color:"#16a34a" }}>{fmt(c.totalGastado||0)}</strong></td>
                          <td style={{ ...st.td,fontSize:11,color:G2 }}>{c.ultimaCompra}</td>
                          <td style={st.td}>
                            <div style={{ display:"flex",gap:4 }}>
                              <button style={{ ...st.btnSm(),fontSize:12,padding:"3px 8px" }} onClick={()=>setEditando(c.id)}>✏️</button>
                              {!c.fromVentas&&<button style={{ ...st.btnSm("#fee"),fontSize:12,padding:"3px 8px" }} onClick={()=>deleteCliente(c.id)}>🗑️</button>}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vista TARJETAS */}
      {vistaTab==="tarjetas" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
          {filtered.map(c=>(
            <div key={c.id} style={{ background:"#fff", border:"1.5px solid #e5e5e0", borderRadius:14, padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <Avatar nombre={c.nombre} size={42}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{c.nombre}</div>
                  {c.ciudad&&<div style={{ fontSize:11, color:G2 }}>{c.ciudad}</div>}
                </div>
                {c.compras>1&&<span style={{ marginLeft:"auto", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#eff6ff", color:"#3b82f6" }}>⭐ Recurrente</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <div style={{ background:"#f0fdf4", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:"#888", textTransform:"uppercase", fontWeight:600 }}>Total gastado</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#16a34a" }}>{fmt(c.totalGastado||0)}</div>
                </div>
                <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:"#888", textTransform:"uppercase", fontWeight:600 }}>Compras</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{c.compras}</div>
                </div>
              </div>
              {(c.plataformas||[]).length>0&&(
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                  {c.plataformas.map(p=>(
                    <span key={p} style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, background:(PLAT_COLOR[p]||"#eee")+"22", color:PLAT_COLOR[p]||"#666" }}>{p}</span>
                  ))}
                </div>
              )}
              {c.telefono&&<div style={{ fontSize:11, color:G1 }}>📞 {c.telefono}</div>}
              {c.correo&&<div style={{ fontSize:11, color:G1 }}>✉️ {c.correo}</div>}
              {!c.fromVentas&&(
                <div style={{ display:"flex", gap:6, marginTop:12 }}>
                  <button style={{ ...st.btnSm(), flex:1, fontSize:11 }} onClick={()=>setEditando(c.id)}>✏️ Editar</button>
                  <button style={{ ...st.btnSm("#fee"), fontSize:11, padding:"5px 10px" }} onClick={()=>deleteCliente(c.id)}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
