"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import { G1, G2, MODELOS, TALLAS, PAGE_SIZES } from "../../lib/constants";

const MODELO_COLORS = { cosmopolitan:"#FFF200", espressomartini:"#4D96FF", cubalibre:"#FF6B6B", negroni:"#B983FF", moscowmule:"#6BCB77" };

export default function TabInventario({ st, fmt, inventory, vendidas, disponibles, onNew, onEdit, onDelete }) {
  const [filterModelo, setFilterModelo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTalla, setFilterTalla] = useState("all");
  const [filterDrop, setFilterDrop] = useState("all");
  const [search, setSearch] = useState("");
  const [invPage, setInvPage] = useState(1);
  const [invPerPage, setInvPerPage] = useState(20);
  const [ampliado, setAmpliado] = useState(null);
  const [showSugerencias, setShowSugerencias] = useState(false);

  const filteredInv = useMemo(()=>inventory.filter((i)=>{
    if(filterModelo!=="all"&&i.modelo!==filterModelo)return false;
    if(filterTalla!=="all"&&i.talla!==filterTalla)return false;
    if(filterDrop!=="all"&&(i.drop||"DROP 001")!==filterDrop)return false;
    if(filterDrop!=="all"&&(i.drop||"DROP 001")!==filterDrop)return false;
    const sold=vendidas.includes(i.codigo);
    if(filterStatus==="disponible"&&sold)return false;
    if(filterStatus==="no_disponible"&&!sold)return false;
    if(search){const q=search.toLowerCase();if(!i.codigo.toLowerCase().includes(q)&&!i.nombre.toLowerCase().includes(q)&&!i.talla.toLowerCase().includes(q))return false;}
    return true;
  }),[inventory,vendidas,filterModelo,filterStatus,filterTalla,filterDrop,search]);

  const masVendidos = useMemo(()=>{
    const counts={};
    inventory.forEach((i)=>{if(vendidas.includes(i.codigo))counts[i.modelo]=(counts[i.modelo]||0)+1;});
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,c])=>({...MODELOS.find(m=>m.id===id),count:c})).filter(Boolean);
  },[inventory,vendidas]);

  const sugerencias = search.length>0?filteredInv.slice(0,6):[];
  const drops = useMemo(()=>[...new Set(inventory.map(i=>i.drop||"DROP 001"))].sort(),[inventory]);

  const effPerPage = invPerPage==="Todos"?filteredInv.length||1:invPerPage;
  const totalPages = Math.ceil(filteredInv.length/effPerPage)||1;
  const pageItems = filteredInv.slice((invPage-1)*effPerPage,invPage*effPerPage);

  function exportInvExcel(){
    const rows=filteredInv.map((i)=>({ Codigo:i.codigo,Modelo:i.nombre,Talla:i.talla,Drop:i.drop||"DROP 001",Status:vendidas.includes(i.codigo)?"NO DISPONIBLE":"DISPONIBLE","Precio Costo":i.precio_costo,"Precio Venta":i.precio_venta }));
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Inventario");XLSX.writeFile(wb,`mute_inventario_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
  function exportInvPDF(){
    const rows=filteredInv.map((i)=>`<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.talla}</td><td>${vendidas.includes(i.codigo)?"NO DISP":"DISP"}</td><td>$${i.precio_costo}</td><td>$${i.precio_venta}</td></tr>`).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>mute. Inventario</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px 8px}th{background:#000;color:#FFF200}</style></head><body><h1>mute. Inventario</h1><table><thead><tr><th>Código</th><th>Modelo</th><th>Talla</th><th>Status</th><th>Costo</th><th>Venta</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),300);}
  }

  return (
    <div>
      {ampliado&&(
        <div onClick={()=>setAmpliado(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out" }}>
          <div style={{ position:"relative",width:"min(85vw,520px)",height:"min(85vh,640px)" }}>
            <Image src={ampliado} alt="Modelo ampliado" fill style={{ objectFit:"contain",borderRadius:12 }}/>
          </div>
          <div style={{ position:"absolute",top:20,right:24,color:"#fff",fontSize:28,cursor:"pointer" }}>×</div>
        </div>
      )}

      <div style={st.statsRow}>
        <div style={st.statCard}><div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Total</div><div style={{ fontSize:28,fontWeight:700 }}>{inventory.length}</div></div>
        <div style={{ ...st.statCard,borderTop:"3px solid #6BCB77" }}><div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Disponibles</div><div style={{ fontSize:28,fontWeight:700,color:"#1a7a1a" }}>{disponibles.length}</div></div>
        <div style={{ ...st.statCard,borderTop:"3px solid #FF6B6B" }}><div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>No Disponibles</div><div style={{ fontSize:28,fontWeight:700,color:"#b30000" }}>{inventory.length-disponibles.length}</div></div>
      </div>

      {masVendidos.length>0&&(
        <div style={{ ...st.card,marginBottom:20 }}>
          <div style={st.sTitle}>🔥 Más Vendidos</div>
          <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            {masVendidos.map((m)=>(
              <div key={m.id} onClick={()=>setAmpliado(m.img)} style={{ display:"flex",alignItems:"center",gap:10,cursor:"zoom-in",background:"#f9f9f6",borderRadius:10,padding:"8px 12px",border:`2px solid ${MODELO_COLORS[m.id]}` }}>
                <div style={{ position:"relative",width:40,height:40,borderRadius:6,overflow:"hidden",flexShrink:0 }}>
                  <Image src={m.img} alt={m.nombre} fill style={{ objectFit:"cover" }} sizes="40px"/>
                </div>
                <div><div style={{ fontSize:12,fontWeight:700 }}>{m.nombre}</div><div style={{ fontSize:11,color:G1 }}>{m.count} vendidas</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ position:"relative",flex:"1 1 240px",minWidth:200 }}>
          <input style={{ ...st.inp }} placeholder="🔍 Buscar código, modelo, talla..." value={search}
            onChange={(e)=>{setSearch(e.target.value);setInvPage(1);setShowSugerencias(true);}}
            onFocus={()=>setShowSugerencias(true)} onBlur={()=>setTimeout(()=>setShowSugerencias(false),150)}/>
          {showSugerencias&&sugerencias.length>0&&(
            <div style={{ position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,zIndex:50,boxShadow:"0 4px 16px rgba(0,0,0,0.1)",overflow:"hidden" }}>
              {sugerencias.map((i)=>{
                const sold=vendidas.includes(i.codigo);
                const m=MODELOS.find(mm=>mm.id===i.modelo);
                return (
                  <div key={i.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #f0f0ec" }} onMouseDown={()=>{setSearch(i.codigo);setShowSugerencias(false);}}>
                    {m?.img&&<div style={{ position:"relative",width:32,height:32,borderRadius:4,overflow:"hidden",flexShrink:0 }}><Image src={m.img} alt={i.nombre} fill style={{ objectFit:"cover" }} sizes="32px"/></div>}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:600 }}>{i.codigo} · {i.nombre}</div>
                      <div style={{ fontSize:11,color:G1 }}>Talla {i.talla}</div>
                    </div>
                    <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:sold?"#000":"#FFF200",color:sold?"#fff":"#000" }}>{sold?"NO DISP":"DISP"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <select style={{ ...st.sel,width:160 }} value={filterModelo} onChange={(e)=>{setFilterModelo(e.target.value);setInvPage(1);}}>
          <option value="all">Todos los modelos</option>
          {MODELOS.map((m)=><option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select style={{ ...st.sel,width:100 }} value={filterTalla} onChange={(e)=>{setFilterTalla(e.target.value);setInvPage(1);}}>
          <option value="all">Talla</option>
          {TALLAS.map((t)=><option key={t} value={t}>{t}</option>)}
        </select>
        <select style={{ ...st.sel,width:120 }} value={filterDrop} onChange={(e)=>{setFilterDrop(e.target.value);setInvPage(1);}}>
          <option value="all">Drop</option>
          <option value="DROP 001">DROP 001</option>
        </select>
        <select style={{ ...st.sel,width:130 }} value={filterDrop} onChange={(e)=>{setFilterDrop(e.target.value);setInvPage(1);}}>
          <option value="all">Drop</option>
          {drops.map((d)=><option key={d} value={d}>{d}</option>)}
        </select>
        <select style={{ ...st.sel,width:140 }} value={filterStatus} onChange={(e)=>{setFilterStatus(e.target.value);setInvPage(1);}}>
          <option value="all">Status</option>
          <option value="disponible">Disponible</option>
          <option value="no_disponible">No Disponible</option>
        </select>
        <select style={{ ...st.sel,width:130 }} value={invPerPage} onChange={(e)=>{const v=e.target.value;setInvPerPage(v==="Todos"?"Todos":Number(v));setInvPage(1);}}>
          {PAGE_SIZES.map((p)=><option key={p} value={p}>{p==="Todos"?"Todos":`${p} / pág`}</option>)}
        </select>
        <span style={{ fontSize:13,color:G1 }}>{filteredInv.length} resultados</span>
        <div style={{ display:"flex",gap:8,marginLeft:"auto" }}>
          <button style={st.btnSm()} onClick={exportInvExcel}>📊 Excel</button>
          <button style={st.btnSm()} onClick={exportInvPDF}>📄 PDF</button>
          <button style={st.btn(true)} onClick={onNew}>+ Agregar</button>
        </div>
      </div>

      <div style={st.card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={st.sTitle}>Listado ({filteredInv.length})</div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <button style={{ ...st.btnSm(),padding:"4px 12px" }} onClick={()=>setInvPage(p=>Math.max(1,p-1))} disabled={invPage===1}>‹</button>
            <span style={{ fontSize:13,color:G1 }}>{invPage}/{totalPages}</span>
            <button style={{ ...st.btnSm(),padding:"4px 12px" }} onClick={()=>setInvPage(p=>Math.min(totalPages,p+1))} disabled={invPage>=totalPages}>›</button>
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr>{["","Código","Modelo","Talla","Drop","Status","Costo","Venta",""].map((h,i)=><th key={i} style={st.th}>{h}</th>)}</tr></thead>
            <tbody>
              {pageItems.map((i)=>{
                const sold=vendidas.includes(i.codigo);
                const m=MODELOS.find(mm=>mm.id===i.modelo);
                return (
                  <tr key={i.id}>
                    <td style={{ ...st.td,width:40,padding:"6px 8px" }}>
                      {m?.img&&<div onClick={()=>setAmpliado(m.img)} style={{ position:"relative",width:32,height:32,borderRadius:4,overflow:"hidden",cursor:"zoom-in",flexShrink:0 }}><Image src={m.img} alt={i.nombre} fill style={{ objectFit:"cover" }} sizes="32px"/></div>}
                    </td>
                    <td style={st.td}><code style={{ background:"#f5f5f0",padding:"2px 5px",borderRadius:3 }}>{i.codigo}</code></td>
                    <td style={st.td}><span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:8,height:8,borderRadius:"50%",background:MODELO_COLORS[i.modelo]||"#ccc",display:"inline-block" }}/>{i.nombre}</span></td>
                    <td style={st.td}><strong>{i.talla}</strong></td>
                    <td style={st.td}>{i.drop||"DROP 001"}</td>
                    <td style={st.td}><span style={st.badge(sold)}>{sold?"NO DISPONIBLE":"DISPONIBLE"}</span></td>
                    <td style={st.td}>{fmt(i.precio_costo)}</td>
                    <td style={st.td}><strong>{fmt(i.precio_venta)}</strong></td>
                    <td style={st.td}>
                      <div style={{ display:"flex",gap:5 }}>
                        <button style={{ ...st.btnSm(),fontSize:13,padding:"3px 8px" }} onClick={()=>onEdit(i)}>✏️</button>
                        <button style={{ ...st.btnSm("#fee"),fontSize:13,padding:"3px 8px" }} onClick={()=>onDelete(i)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInv.length===0&&<div style={{ textAlign:"center",padding:24,color:G2 }}>No hay prendas que coincidan.</div>}
        </div>
        <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:16,alignItems:"center",flexWrap:"wrap" }}>
          <button style={{ ...st.btnSm(),padding:"6px 16px" }} onClick={()=>setInvPage(p=>Math.max(1,p-1))} disabled={invPage===1}>← Anterior</button>
          {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(p=>(
            <button key={p} style={{ ...st.btnSm(p===invPage?"#FFF200":undefined),padding:"6px 12px",fontWeight:p===invPage?700:400 }} onClick={()=>setInvPage(p)}>{p}</button>
          ))}
          <button style={{ ...st.btnSm(),padding:"6px 16px" }} onClick={()=>setInvPage(p=>Math.min(totalPages,p+1))} disabled={invPage>=totalPages}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
