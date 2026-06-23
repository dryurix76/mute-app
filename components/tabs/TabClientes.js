"use client";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { G1, G2, MODELOS, PAGOS, PLATAFORMAS_FILTRO, REFERIDOS_FILTRO, PLATAFORMAS, EDAD_BRACKETS, edadBracket } from "../../lib/constants";

export default function TabClientes({ st, fmt, ventas }) {
  const [search, setSearch] = useState("");
  const [filterEdad, setFilterEdad] = useState("all");
  const [filterPago, setFilterPago] = useState("all");
  const [filterPlataforma, setFilterPlataforma] = useState("all");
  const [filterReferido, setFilterReferido] = useState("all");
  const [editando, setEditando] = useState(null);
  const [clientesExtra, setClientesExtra] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre:"", telefono:"", correo:"", ciudad:"", edad:"", plataforma:"Instagram" });

  const clientesDeVentas = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      const key = (v.correo&&v.correo.trim())||(v.telefono&&v.telefono.trim())||v.comprador;
      if (!map[key]) {
        map[key] = {
          id:key, nombre:v.comprador, telefono:v.telefono||"", correo:v.correo||"",
          ciudad:v.ciudad||"", edad:v.edad||"", compras:0, totalGastado:0, itemsComprados:0,
          pagos:new Set(), plataformas:new Set(), modelos:new Set(), referidos:new Set(),
          primeraCompra:v.fecha, ultimaCompra:v.fecha, fromVentas:true,
        };
      }
      const c = map[key];
      c.compras++; c.totalGastado+=v.monto; c.itemsComprados+=v.items||1;
      c.pagos.add(v.pago); c.plataformas.add(v.plataforma);
      if(v.referido)c.referidos.add(v.referido);
      const mn = MODELOS.find((m)=>m.id===v.modelo)?.nombre; if(mn)c.modelos.add(mn);
      if(v.fecha<c.primeraCompra)c.primeraCompra=v.fecha;
      if(v.fecha>c.ultimaCompra)c.ultimaCompra=v.fecha;
      if(v.telefono)c.telefono=v.telefono; if(v.correo)c.correo=v.correo;
      if(v.ciudad)c.ciudad=v.ciudad; if(v.edad)c.edad=v.edad;
    });
    return Object.values(map).map((c)=>({ ...c, pagos:Array.from(c.pagos), plataformas:Array.from(c.plataformas), modelos:Array.from(c.modelos), referidos:Array.from(c.referidos) }));
  }, [ventas]);

  const clientes = useMemo(() => {
    const all = [...clientesDeVentas];
    clientesExtra.forEach((ce) => { if(!all.find((c)=>c.id===ce.id))all.push(ce); });
    return all;
  }, [clientesDeVentas, clientesExtra]);

  const filteredClientes = useMemo(() => clientes.filter((c) => {
    if(filterEdad!=="all"&&edadBracket(c.edad)!==filterEdad)return false;
    if(filterPago!=="all"&&!(c.pagos||[]).includes(filterPago))return false;
    if(filterPlataforma!=="all"&&!(c.plataformas||[]).includes(filterPlataforma))return false;
    if(filterReferido!=="all"&&!(c.referidos||[]).includes(filterReferido))return false;
    if(search){
      const q=search.toLowerCase();
      const hay=[c.nombre,c.telefono,c.correo,c.ciudad,c.edad,...(c.modelos||[])].filter(Boolean).join(" ").toLowerCase();
      if(!hay.includes(q))return false;
    }
    return true;
  }).sort((a,b)=>(b.totalGastado||0)-(a.totalGastado||0)), [clientes,search,filterEdad,filterPago,filterPlataforma,filterReferido]);

  const filtersActive = search||filterEdad!=="all"||filterPago!=="all"||filterPlataforma!=="all"||filterReferido!=="all";
  const clearFilters = ()=>{setSearch("");setFilterEdad("all");setFilterPago("all");setFilterPlataforma("all");setFilterReferido("all");};
  const clientesRecurrentes = clientes.filter((c)=>c.compras>1).length;
  const ticketPromedio = clientes.length?clientes.reduce((s,c)=>s+(c.totalGastado||0),0)/clientes.length:0;

  function deleteCliente(id) {
    setClientesExtra((prev)=>prev.filter((c)=>c.id!==id));
  }

  function saveEdit(id, data) {
    setClientesExtra((prev)=>prev.map((c)=>c.id===id?{...c,...data}:c));
    setEditando(null);
  }

  function addCliente() {
    if(!newCliente.nombre.trim())return;
    const c = {
      id:"manual_"+Date.now(), nombre:newCliente.nombre, telefono:newCliente.telefono,
      correo:newCliente.correo, ciudad:newCliente.ciudad, edad:newCliente.edad,
      compras:0, totalGastado:0, itemsComprados:0, pagos:[], plataformas:[newCliente.plataforma],
      modelos:[], referidos:[], primeraCompra:"—", ultimaCompra:"—", fromVentas:false,
    };
    setClientesExtra((prev)=>[...prev,c]);
    setNewCliente({ nombre:"",telefono:"",correo:"",ciudad:"",edad:"",plataforma:"Instagram" });
    setShowAddForm(false);
  }

  function exportExcel() {
    const rows = filteredClientes.map((c)=>({ Cliente:c.nombre,Telefono:c.telefono,Correo:c.correo,Edad:c.edad,Ciudad:c.ciudad,Compras:c.compras,Items:c.itemsComprados,"Total Gastado":c.totalGastado,Plataformas:(c.plataformas||[]).join(", "),"Metodos de Pago":(c.pagos||[]).join(", "),Modelos:(c.modelos||[]).join(", "),"Primera Compra":c.primeraCompra,"Ultima Compra":c.ultimaCompra }));
    const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Clientes");
    XLSX.writeFile(wb,`mute_clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return (
    <div>
      <div style={{ ...st.statsRow, marginBottom:16 }}>
        <div style={st.statCard}><div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Total Clientes</div><div style={{ fontSize:28,fontWeight:700 }}>{clientes.length}</div></div>
        <div style={st.statCard}><div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Recurrentes</div><div style={{ fontSize:28,fontWeight:700 }}>{clientesRecurrentes}</div><div style={{ fontSize:12,color:G1 }}>{clientes.length?Math.round(clientesRecurrentes/clientes.length*100):0}%</div></div>
        <div style={st.statCard}><div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Ticket Promedio</div><div style={{ fontSize:28,fontWeight:700 }}>{fmt(ticketPromedio)}</div></div>
      </div>

      <div style={{ ...st.card, marginBottom:16, padding:"16px 20px" }}>
        <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
          <input style={{ ...st.inp,width:260,flex:"none" }} placeholder="🔍 Buscar nombre, teléfono, correo..." value={search} onChange={(e)=>setSearch(e.target.value)}/>
          <select style={{ ...st.sel,width:140 }} value={filterEdad} onChange={(e)=>setFilterEdad(e.target.value)}>
            <option value="all">Edad: Todas</option>
            {EDAD_BRACKETS.map((e)=><option key={e} value={e}>{e}</option>)}
          </select>
          <select style={{ ...st.sel,width:150 }} value={filterPago} onChange={(e)=>setFilterPago(e.target.value)}>
            <option value="all">Pago: Todos</option>
            {PAGOS.map((p)=><option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ ...st.sel,width:160 }} value={filterPlataforma} onChange={(e)=>setFilterPlataforma(e.target.value)}>
            <option value="all">Plataforma: Todas</option>
            {PLATAFORMAS_FILTRO.map((p)=><option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ ...st.sel,width:170 }} value={filterReferido} onChange={(e)=>setFilterReferido(e.target.value)}>
            <option value="all">Referido: Todos</option>
            {REFERIDOS_FILTRO.map((r)=><option key={r} value={r}>{r}</option>)}
          </select>
          {filtersActive&&<button style={st.btnSm()} onClick={clearFilters}>✕ Limpiar</button>}
          <div style={{ display:"flex",gap:8,marginLeft:"auto" }}>
            <button style={st.btnSm()} onClick={exportExcel}>📊 Excel</button>
            <span style={{ fontSize:13,color:G1,alignSelf:"center" }}>{filteredClientes.length} de {clientes.length}</span>
            <button style={st.btn(true)} onClick={()=>setShowAddForm(true)}>+ Agregar Cliente</button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div style={{ ...st.card, marginBottom:16, background:"#f9f9f6" }}>
          <div style={{ ...st.sTitle, marginBottom:14 }}>Nuevo cliente</div>
          <div style={st.fGrid}>
            <div><label style={st.fLabel}>Nombre *</label><input style={st.inp} value={newCliente.nombre} onChange={(e)=>setNewCliente({...newCliente,nombre:e.target.value})}/></div>
            <div><label style={st.fLabel}>Teléfono</label><input style={st.inp} value={newCliente.telefono} onChange={(e)=>setNewCliente({...newCliente,telefono:e.target.value})}/></div>
            <div><label style={st.fLabel}>Correo</label><input type="email" style={st.inp} value={newCliente.correo} onChange={(e)=>setNewCliente({...newCliente,correo:e.target.value})}/></div>
            <div><label style={st.fLabel}>Ciudad</label><input style={st.inp} value={newCliente.ciudad} onChange={(e)=>setNewCliente({...newCliente,ciudad:e.target.value})}/></div>
            <div><label style={st.fLabel}>Edad</label><input type="number" style={st.inp} value={newCliente.edad} onChange={(e)=>setNewCliente({...newCliente,edad:e.target.value})}/></div>
            <div><label style={st.fLabel}>Plataforma</label><select style={st.sel} value={newCliente.plataforma} onChange={(e)=>setNewCliente({...newCliente,plataforma:e.target.value})}>{PLATAFORMAS.map((p)=><option key={p}>{p}</option>)}</select></div>
          </div>
          <div style={{ display:"flex",gap:10,marginTop:14 }}>
            <button style={st.btn(true)} onClick={addCliente} disabled={!newCliente.nombre.trim()}>Guardar</button>
            <button style={st.btn(false)} onClick={()=>setShowAddForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {filteredClientes.length===0 ? (
        <div style={{ ...st.card, textAlign:"center",padding:24,color:G2 }}>
          {clientes.length===0?"Aún no hay clientes (se generan automáticamente desde Ventas).":"Sin resultados."}
        </div>
      ) : (
        <div style={st.card}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead><tr>{["Cliente","Contacto","Edad","Ciudad","Plataforma","Compras","Total","Última Compra",""].map((h)=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredClientes.map((c)=>(
                  <tr key={c.id}>
                    {editando===c.id ? (
                      <>
                        <td style={st.td}><input style={{ ...st.inp,width:130 }} defaultValue={c.nombre} id={`edit_nombre_${c.id}`}/></td>
                        <td style={st.td}>
                          <input style={{ ...st.inp,width:120,marginBottom:4 }} defaultValue={c.telefono} id={`edit_tel_${c.id}`} placeholder="Teléfono"/>
                          <input style={{ ...st.inp,width:120 }} defaultValue={c.correo} id={`edit_correo_${c.id}`} placeholder="Correo"/>
                        </td>
                        <td style={st.td}><input style={{ ...st.inp,width:50 }} defaultValue={c.edad} id={`edit_edad_${c.id}`}/></td>
                        <td style={st.td}><input style={{ ...st.inp,width:100 }} defaultValue={c.ciudad} id={`edit_ciudad_${c.id}`}/></td>
                        <td style={st.td} colSpan={3}></td>
                        <td style={st.td}></td>
                        <td style={st.td}>
                          <div style={{ display:"flex",gap:4 }}>
                            <button style={{ ...st.btnSm(),padding:"3px 8px",fontSize:11 }} onClick={()=>saveEdit(c.id,{
                              nombre:document.getElementById(`edit_nombre_${c.id}`)?.value||c.nombre,
                              telefono:document.getElementById(`edit_tel_${c.id}`)?.value||c.telefono,
                              correo:document.getElementById(`edit_correo_${c.id}`)?.value||c.correo,
                              edad:document.getElementById(`edit_edad_${c.id}`)?.value||c.edad,
                              ciudad:document.getElementById(`edit_ciudad_${c.id}`)?.value||c.ciudad,
                            })}>✓</button>
                            <button style={{ ...st.btnSm("#fee"),padding:"3px 8px",fontSize:11 }} onClick={()=>setEditando(null)}>✕</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={st.td}><strong>{c.nombre}</strong>{c.compras>1&&<span style={{ ...st.PC,marginLeft:6,fontSize:9 }}>Recurrente</span>}</td>
                        <td style={st.td}>{c.telefono&&<div style={{ fontSize:11 }}>{c.telefono}</div>}{c.correo&&<div style={{ fontSize:11,color:G2 }}>{c.correo}</div>}</td>
                        <td style={st.td}>{c.edad||"—"}</td>
                        <td style={st.td}>{c.ciudad||"—"}</td>
                        <td style={st.td}><span style={{ fontSize:11 }}>{(c.plataformas||[]).join(", ")||"—"}</span></td>
                        <td style={st.td}><strong>{c.compras}</strong></td>
                        <td style={st.td}><strong>{fmt(c.totalGastado||0)}</strong></td>
                        <td style={{ ...st.td,fontSize:11,color:G1 }}>{c.ultimaCompra}</td>
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
        </div>
      )}
    </div>
  );
}
