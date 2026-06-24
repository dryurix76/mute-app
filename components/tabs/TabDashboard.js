"use client";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { G1, G2, MODELOS, PLATAFORMAS } from "../../lib/constants";

const MODELO_COLORS = { cosmopolitan:"#FFF200", espressomartini:"#4D96FF", cubalibre:"#FF6B6B", negroni:"#B983FF", moscowmule:"#6BCB77" };
const PLAT_COLORS = { Instagram:"#E1306C", WhatsApp:"#25D366", Evento:"#FF6B6B", Otro:"#969696", Zelle:"#6600CC", Binance:"#F3BA2F", Zinli:"#00B4D8", Venmo:"#3D95CE", Cash:"#aaa" };

export default function TabDashboard({ st, fmt, inventory, ventas, disponibles, totalIngresos, margen }) {
  const ventasPorModelo = MODELOS.map((m)=>({ name:m.nombre.split(" ")[0], vendidas:ventas.filter((v)=>v.modelo===m.id).length, color:MODELO_COLORS[m.id]||"#ccc" }));
  const ventasPorPlataforma = PLATAFORMAS.map((p)=>({ name:p, value:ventas.filter((v)=>v.plataforma===p).length, color:PLAT_COLORS[p]||"#ccc" })).filter((p)=>p.value>0);

  return (
    <div>
      <div style={st.statsRow}>
        {[
          { label:"Total", val:inventory.length, sub:"prendas", accent:"#000" },
          { label:"Vendidas", val:ventas.length, sub:`${fmt(totalIngresos)} ingresos`, accent:"#4D96FF" },
          { label:"Disponibles", val:disponibles.length, sub:`${inventory.length?Math.round(disponibles.length/inventory.length*100):0}%`, accent:"#6BCB77" },
          { label:"Margen", val:fmt(margen), sub:"bruto", accent:"#FFF200" },
        ].map((s)=>(
          <div key={s.label} style={{ ...st.statCard, borderTop:`3px solid ${s.accent}` }}>
            <div style={{ fontSize:11, color:G2, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.accent==="#FFF200"?"#000":s.accent==="#000"?"#000":s.accent }}>{s.val}</div>
            <div style={{ fontSize:12, color:G1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...st.card, marginBottom:20 }}>
        <div style={st.sTitle}>Catálogo — Cápsula 001</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14 }}>
          {MODELOS.map((m)=>{
            const sold=ventas.filter((v)=>v.modelo===m.id).length;
            const total=inventory.filter((i)=>i.modelo===m.id).length;
            const pct=total?Math.round(sold/total*100):0;
            return (
              <div key={m.id} style={{ borderRadius:10, overflow:"hidden", border:`2px solid ${MODELO_COLORS[m.id]}` }}>
                <div style={{ position:"relative", width:"100%", height:160, background:"#f0f0ec" }}>
                  <Image src={m.img} alt={m.nombre} fill style={{ objectFit:"cover" }} sizes="200px"/>
                </div>
                <div style={{ padding:"8px 10px" }}>
                  <div style={{ fontSize:12, fontWeight:700 }}>{m.nombre}</div>
                  <div style={{ fontSize:11, color:G1, marginTop:2 }}>{total-sold} disp · {sold} vendidas</div>
                  <div style={{ height:4, background:"#eee", borderRadius:4, marginTop:6 }}>
                    <div style={{ height:4, width:`${pct}%`, background:MODELO_COLORS[m.id], borderRadius:4 }}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={st.grid2}>
        <div style={st.card}>
          <div style={st.sTitle}>Ventas por modelo</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ventasPorModelo} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
              <Bar dataKey="vendidas" radius={[6,6,0,0]}>
                {ventasPorModelo.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
            {ventasPorModelo.map((m)=>(
              <span key={m.name} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:G1 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:m.color, display:"inline-block" }}/>{m.name} ({m.vendidas})
              </span>
            ))}
          </div>
        </div>
        <div style={st.card}>
          <div style={st.sTitle}>Plataformas</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ventasPorPlataforma} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({name,value})=>`${name}(${value})`} labelLine={false}>
                {ventasPorPlataforma.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
            {ventasPorPlataforma.map((p)=>(
              <span key={p.name} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:G1 }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:p.color, display:"inline-block" }}/>{p.name} ({p.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={st.card}>
        <div style={st.sTitle}>Últimas ventas</div>
        {ventas.length===0 ? <div style={{ textAlign:"center", padding:24, color:G2 }}>Aún no hay ventas.</div> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Código","Modelo","Comprador","Vendedora","Plataforma","Pago","Monto"].map((h)=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {ventas.slice(0,5).map((v)=>(
                  <tr key={v.id}>
                    <td style={st.td}><code style={{ background:"#f5f5f0", padding:"2px 5px", borderRadius:3, fontSize:11 }}>{v.codigo}</code></td>
                    <td style={st.td}><span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:8, height:8, borderRadius:"50%", background:MODELO_COLORS[v.modelo]||"#ccc", display:"inline-block" }}/>{MODELOS.find((m)=>m.id===v.modelo)?.nombre}</span></td>
                    <td style={st.td}>{v.comprador}</td>
                    <td style={st.td}>{v.vendedora}</td>
                    <td style={st.td}><span style={{ background:PLAT_COLORS[v.plataforma]||"#eee", color:["Instagram","Zelle","Binance"].includes(v.plataforma)?"#fff":"#000", padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600, whiteSpace:"nowrap" }}>{v.plataforma}</span></td>
                    <td style={st.td}>{v.pago}</td>
                    <td style={st.td}><strong>{fmt(v.monto)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Últimos deliveries */}
      {(() => {
        const deliveries = ventas.filter((v) => (v.delivery || "Local") === "Local").slice(0, 6);
        if (deliveries.length === 0) return null;
        const ESTADOS = ["Entregado","Entregado","En camino","Conductor asignado","Pendiente"];
        const CONDUCTORES = ["Carlos Pérez","María Gómez","Luis Hernández","Andrea Salas"];
        return (
          <div style={{ ...st.card, marginTop: 20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={st.sTitle}>🛵 Últimos Deliveries</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#7dd8c0", boxShadow:"0 0 6px #7dd8c0" }}/>
                <span style={{ fontSize:11, color:G2 }}>Ridery 360 · Simulación</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {deliveries.map((v, idx) => {
                const seed = (v.id||"").toString().split("").reduce((a,c)=>a+c.charCodeAt(0),idx*7);
                const estado = ESTADOS[seed % ESTADOS.length];
                const conductor = CONDUCTORES[seed % CONDUCTORES.length];
                const trackingId = `RID-${100000+(seed%900000)}`;
                const estadoColor = {
                  "Entregado": { bg:"#e8f5e8", text:"#1a7a1a" },
                  "En camino": { bg:"#e8eefc", text:"#1a4a9e" },
                  "Conductor asignado": { bg:"#fff8d6", text:"#8a6d00" },
                  "Pendiente": { bg:"#f0f0ec", text:"#6E6E6E" },
                }[estado] || { bg:"#f0f0ec", text:"#6E6E6E" };
                return (
                  <div key={v.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f9f9f6", borderRadius:10, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{v.comprador}</div>
                      <div style={{ fontSize:11, color:G2 }}>{MODELOS.find((m)=>m.id===v.modelo)?.nombre} · {v.fecha}</div>
                    </div>
                    <code style={{ fontSize:10, background:"#ebebeb", padding:"2px 7px", borderRadius:4, color:G1 }}>{trackingId}</code>
                    <div style={{ fontSize:11, color:G1 }}>🏍 {conductor}</div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:estadoColor.bg, color:estadoColor.text, whiteSpace:"nowrap" }}>{estado}</span>
                    <strong style={{ fontSize:12, color:"#1a7a1a", whiteSpace:"nowrap" }}>{fmt(v.costoDelivery || 5)}</strong>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:11, color:G2, marginTop:12, textAlign:"center" }}>
              Estados simulados — se conectarán en vivo cuando tengan acceso a la API corporativa de Ridery 360
            </div>
          </div>
        );
      })()}
    </div>
  );
}
