"use client";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { G1, G2, GASTO_CONCEPTOS } from "../../lib/constants";

const PALETTE = ["#4D96FF","#FF6B6B","#6BCB77","#FFF200","#B983FF","#FFA94D","#E1306C","#25D366","#F3BA2F","#00B4D8","#FF9F43","#54A0FF"];
const MESES_SHORT = ["E","F","M","A","M","J","J","A","S","O","N","D"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmt(n) { return `$${Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`; }

export default function TabGastos({ st, fmt: fmtProp, gastos, totalIngresos, onNew, onEdit, onDelete }) {
  const [vistaTab, setVistaTab] = useState("resumen");

  const totalGastos = gastos.reduce((s,g)=>s+g.cantidad,0);
  const balance = totalIngresos - totalGastos;
  const pctGastos = totalIngresos > 0 ? Math.round((totalGastos/totalIngresos)*100) : 0;

  const gastosPorConcepto = useMemo(()=>{
    const m={};
    gastos.forEach((g)=>{ m[g.concepto]=(m[g.concepto]||0)+g.cantidad; });
    return Object.entries(m).map(([name,value])=>({ name, value })).sort((a,b)=>b.value-a.value);
  },[gastos]);

  const gastosPorPago = useMemo(()=>{
    const m={};
    gastos.forEach((g)=>{ m[g.pago]=(m[g.pago]||0)+g.cantidad; });
    return Object.entries(m).map(([name,value])=>({ name, value })).sort((a,b)=>b.value-a.value);
  },[gastos]);

  const gastosPorMes = useMemo(()=>{
    const m={};
    gastos.forEach((g)=>{
      const d=new Date(g.fecha||Date.now());
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!m[k])m[k]={ key:k, label:`${MESES[d.getMonth()]} ${d.getFullYear()}`, short:MESES_SHORT[d.getMonth()], total:0 };
      m[k].total+=g.cantidad;
    });
    return Object.values(m).sort((a,b)=>a.key.localeCompare(b.key));
  },[gastos]);

  const gastoMayor = gastos.reduce((max,g)=>g.cantidad>max.cantidad?g:max, gastos[0]||{ cantidad:0 });
  const promedioMensual = gastosPorMes.length ? gastosPorMes.reduce((s,m)=>s+m.total,0)/gastosPorMes.length : 0;

  return (
    <div>
      {/* Header financiero */}
      <div style={{ background:"#000", borderRadius:16, padding:"24px 28px", marginBottom:20, color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontSize:11, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Balance Neto del Período</div>
            <div style={{ fontSize:42, fontWeight:700, color:balance>=0?"#6BCB77":"#FF6B6B", letterSpacing:"-1px", lineHeight:1 }}>
              {fmt(balance)}
            </div>
            <div style={{ fontSize:12, color:"#555", marginTop:8 }}>Ingresos {fmt(totalIngresos)} · Gastos {fmt(totalGastos)}</div>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[
              { label:"Total Gastos", val:fmt(totalGastos), color:"#FF6B6B" },
              { label:"% de Ingresos", val:`${pctGastos}%`, color:pctGastos>70?"#FF6B6B":"#6BCB77" },
              { label:"Promedio Mensual", val:fmt(promedioMensual), color:"#4D96FF" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#0d0d0d", borderRadius:10, padding:"12px 16px", minWidth:120 }}>
                <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Barra de progreso gastos vs ingresos */}
        <div style={{ marginTop:20 }}>
          <div style={{ height:8, background:"#111", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:8, width:`${Math.min(100,pctGastos)}%`, background:pctGastos>80?"#FF6B6B":pctGastos>60?"#FFA94D":"#6BCB77", borderRadius:4, transition:"width .5s" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#444", marginTop:4 }}>
            <span>0%</span><span style={{ color:pctGastos>70?"#FF6B6B":"#6BCB77" }}>{pctGastos}% de ingresos gastado</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Tabs internos */}
      <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f0f0ec", borderRadius:10, padding:4 }}>
        {[
          { id:"resumen", label:"📊 Resumen" },
          { id:"detalle", label:"📋 Detalle" },
          { id:"analisis", label:"🔍 Análisis" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setVistaTab(t.id)} style={{ flex:1, padding:"8px 12px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12, fontWeight:vistaTab===t.id?700:400, background:vistaTab===t.id?"#fff":"transparent", color:vistaTab===t.id?"#000":"#888", transition:"all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <button style={st.btn(true)} onClick={onNew}>+ Registrar Gasto</button>
      </div>

      {vistaTab==="resumen" && (
        <>
          {/* KPI cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
            {[
              { label:"Mayor gasto", val:fmt(gastoMayor?.cantidad||0), sub:gastoMayor?.concepto||"—", color:"#FF6B6B", icon:"⬆️" },
              { label:"Registros", val:gastos.length, sub:"total este período", color:"#4D96FF", icon:"📝" },
              { label:"Top categoría", val:gastosPorConcepto[0]?.name||"—", sub:fmt(gastosPorConcepto[0]?.value||0), color:"#B983FF", icon:"🏆" },
              { label:"Top método", val:gastosPorPago[0]?.name||"—", sub:`${gastosPorPago.length} métodos usados`, color:"#6BCB77", icon:"💳" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", border:"1px solid #e5e5e0", borderLeft:`4px solid ${s.color}` }}>
                <div style={{ fontSize:18, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:11, color:G2, textTransform:"uppercase", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:11, color:G1 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div style={st.grid2}>
            <div style={st.card}>
              <div style={st.sTitle}>Por categoría</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={gastosPorConcepto} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({name,value})=>`${name.split(" ")[0]} $${value.toFixed(0)}`} labelLine={false}>
                    {gastosPorConcepto.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{ fontSize:12, borderRadius:8 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={st.card}>
              <div style={st.sTitle}>Evolución mensual</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={gastosPorMes} margin={{ top:0, right:10, left:-20, bottom:0 }}>
                  <XAxis dataKey="short" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{ fontSize:12, borderRadius:8 }}/>
                  <Line type="monotone" dataKey="total" stroke="#FF6B6B" strokeWidth={2.5} dot={{ fill:"#FF6B6B", r:3 }} name="Gastos"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {vistaTab==="detalle" && (
        <div style={st.card}>
          {gastos.length===0 ? (
            <div style={{ textAlign:"center", padding:32, color:G2 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
              No hay gastos registrados aún.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>{["Fecha","Proveedor","Concepto","Método","Monto","Factura",""].map((h)=><th key={h} style={st.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {gastos.map((g,i)=>{
                    const pct = totalGastos>0 ? (g.cantidad/totalGastos*100).toFixed(0) : 0;
                    return (
                      <tr key={g.id} style={{ background:i%2===0?"#fafaf8":"#fff" }}>
                        <td style={{ ...st.td, color:G1, fontSize:11, whiteSpace:"nowrap" }}>{g.fecha}</td>
                        <td style={st.td}><strong>{g.proveedor}</strong></td>
                        <td style={st.td}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ width:8, height:8, borderRadius:"50%", background:PALETTE[GASTO_CONCEPTOS.indexOf(g.concepto)%PALETTE.length], display:"inline-block" }}/>
                            <span style={st.PC}>{g.concepto}</span>
                          </div>
                        </td>
                        <td style={st.td}><span style={{ fontSize:11, color:G1 }}>{g.pago}</span></td>
                        <td style={st.td}>
                          <div><strong style={{ color:"#b30000" }}>{fmt(g.cantidad)}</strong></div>
                          <div style={{ height:2, background:"#eee", borderRadius:2, marginTop:3, width:"80%" }}>
                            <div style={{ height:2, width:`${pct}%`, background:"#FF6B6B", borderRadius:2 }}/>
                          </div>
                        </td>
                        <td style={st.td}>{g.factura?<a href={g.factura} target="_blank" rel="noreferrer" style={{ fontSize:12 }}>Ver 📎</a>:<span style={{ color:"#ccc" }}>—</span>}</td>
                        <td style={st.td}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button style={{ ...st.btnSm(), fontSize:12, padding:"3px 8px" }} onClick={()=>onEdit(g)}>✏️</button>
                            <button style={{ ...st.btnSm("#fee"), fontSize:12, padding:"3px 8px" }} onClick={()=>onDelete(g)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:"#f5f5f0" }}>
                    <td colSpan={4} style={{ ...st.td, fontWeight:700 }}>TOTAL ({gastos.length} registros)</td>
                    <td style={{ ...st.td, fontWeight:700, fontSize:15, color:"#b30000" }}>{fmt(totalGastos)}</td>
                    <td colSpan={2} style={st.td}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {vistaTab==="analisis" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={st.card}>
            <div style={st.sTitle}>Distribución por método de pago</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
              {gastosPorPago.map((p,i)=>{
                const pct = totalGastos>0 ? (p.value/totalGastos*100) : 0;
                return (
                  <div key={p.name}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ width:10, height:10, borderRadius:2, background:PALETTE[i%PALETTE.length], display:"inline-block" }}/>
                        {p.name}
                      </span>
                      <span style={{ color:G1 }}>{fmt(p.value)} <span style={{ color:G2 }}>({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div style={{ height:6, background:"#f0f0ec", borderRadius:4 }}>
                      <div style={{ height:6, width:`${pct}%`, background:PALETTE[i%PALETTE.length], borderRadius:4, transition:"width .5s" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={st.card}>
            <div style={st.sTitle}>Top 5 mayores gastos</div>
            {[...gastos].sort((a,b)=>b.cantidad-a.cantidad).slice(0,5).map((g,i)=>(
              <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f0f0ec" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:PALETTE[i], display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#000", flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{g.proveedor}</div>
                  <div style={{ fontSize:11, color:G2 }}>{g.concepto} · {g.pago} · {g.fecha}</div>
                </div>
                <strong style={{ color:"#b30000", fontSize:14 }}>{fmt(g.cantidad)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
