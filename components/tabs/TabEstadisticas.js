"use client";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { G1, G2, TALLAS, MODELOS, edadBracket, EDAD_BRACKETS } from "../../lib/constants";

const COLORS = ["#FFF200","#4D96FF","#FF6B6B","#6BCB77","#B983FF","#FFA94D","#E1306C","#25D366","#F3BA2F","#00B4D8","#FF9F43","#54A0FF"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function TabEstadisticas({ st, fmt, inventory, ventas, disponibles, margen, totalIngresos }) {
  const ventasPorVendedora = ["Cori","Adri"].map((v)=>({ name:v, count:ventas.filter((x)=>x.vendedora===v).length, ingresos:ventas.filter((x)=>x.vendedora===v).reduce((s,x)=>s+x.monto,0) }));

  const ventasPorMes = useMemo(()=>{
    const counts = {};
    ventas.forEach((v)=>{
      const d = new Date(v.fecha||Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      if(!counts[key])counts[key]={ key, label, ventas:0, ingresos:0 };
      counts[key].ventas++;
      counts[key].ingresos+=v.monto;
    });
    return Object.values(counts).sort((a,b)=>a.key.localeCompare(b.key));
  },[ventas]);

  const ventasPorEdad = useMemo(()=>{
    const counts = {};
    ventas.forEach((v)=>{ const b=edadBracket(v.edad); counts[b]=(counts[b]||0)+1; });
    return EDAD_BRACKETS.map((b)=>({ name:b, value:counts[b]||0 })).filter((b)=>b.value>0);
  },[ventas]);

  const ventasPorPago = useMemo(()=>{
    const counts = {};
    ventas.forEach((v)=>{ counts[v.pago]=(counts[v.pago]||0)+1; });
    return Object.entries(counts).map(([name,value])=>({ name, value })).sort((a,b)=>b.value-a.value);
  },[ventas]);

  const ventasPorModelo = MODELOS.map((m)=>({ name:m.nombre.split(" ")[0], vendidas:ventas.filter((v)=>v.modelo===m.id).length }));

  return (
    <div>
      <div style={st.statsRow}>
        <div style={{ ...st.statCard, borderTop:"3px solid #FFF200" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"#FFF200", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>M</div>
            <div style={{ fontSize:15, fontWeight:600 }}>MUTE</div>
          </div>
          <div style={{ fontSize:11, color:G2, textTransform:"uppercase", marginBottom:4 }}>Ventas totales</div>
          <div style={{ fontSize:24, fontWeight:700 }}>{ventas.length}</div>
          <div style={{ fontSize:12, color:G1 }}>{fmt(totalIngresos)} en ingresos</div>
        </div>
        <div style={{ ...st.statCard, borderTop:"3px solid #4D96FF" }}>
          <div style={{ fontSize:11, color:G2, textTransform:"uppercase", marginBottom:6 }}>Margen bruto</div>
          <div style={{ fontSize:24, fontWeight:700 }}>{fmt(margen)}</div>
          <div style={{ fontSize:12, color:G1 }}>{ventas.length>0&&totalIngresos?Math.round(margen/totalIngresos*100):0}% del total</div>
        </div>
        <div style={{ ...st.statCard, borderTop:"3px solid #6BCB77" }}>
          <div style={{ fontSize:11, color:G2, textTransform:"uppercase", marginBottom:6 }}>Ticket promedio</div>
          <div style={{ fontSize:24, fontWeight:700 }}>{fmt(ventas.length ? totalIngresos/ventas.length : 0)}</div>
          <div style={{ fontSize:12, color:G1 }}>por venta</div>
        </div>
      </div>

      <div style={{ ...st.card, marginBottom:20 }}>
        <div style={st.sTitle}>Ventas por mes</div>
        {ventasPorMes.length===0 ? <div style={{ textAlign:"center", padding:24, color:G2 }}>Sin datos de ventas con fecha.</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ventasPorMes} margin={{ top:0, right:20, left:-20, bottom:0 }}>
              <XAxis dataKey="label" tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
              <Line type="monotone" dataKey="ventas" stroke="#4D96FF" strokeWidth={3} dot={{ fill:"#4D96FF", r:4 }} name="Ventas"/>
              <Line type="monotone" dataKey="ingresos" stroke="#FFF200" strokeWidth={3} dot={{ fill:"#FFF200", r:4 }} name="Ingresos $"/>
            </LineChart>
          </ResponsiveContainer>
        )}
        <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11, color:G1 }}>
          <span><span style={{ display:"inline-block", width:12, height:3, background:"#4D96FF", borderRadius:2, marginRight:4, verticalAlign:"middle" }}/>Unidades vendidas</span>
          <span><span style={{ display:"inline-block", width:12, height:3, background:"#FFF200", borderRadius:2, marginRight:4, verticalAlign:"middle" }}/>Ingresos ($)</span>
        </div>
      </div>

      <div style={st.grid3}>
        <div style={st.card}>
          <div style={st.sTitle}>Por edad</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ventasPorEdad} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value" label={({name,value})=>`${name}(${value})`} labelLine={false}>
                {ventasPorEdad.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={st.card}>
          <div style={st.sTitle}>Por forma de pago</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ventasPorPago} layout="vertical" margin={{ top:0, right:20, left:10, bottom:0 }}>
              <XAxis type="number" tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} axisLine={false} tickLine={false} width={70}/>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
              <Bar dataKey="value" radius={[0,6,6,0]} name="Ventas">
                {ventasPorPago.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={st.card}>
          <div style={st.sTitle}>Por modelo</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ventasPorModelo} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
              <Bar dataKey="vendidas" radius={[6,6,0,0]} name="Vendidas">
                {ventasPorModelo.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={st.card}>
        <div style={st.sTitle}>Disponibilidad por talla</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={TALLAS.map((t)=>({ talla:t, disponible:disponibles.filter((i)=>i.talla===t).length, vendida:ventas.filter((v)=>inventory.find((i)=>i.codigo===v.codigo)?.talla===t).length }))} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <XAxis dataKey="talla" tick={{ fontSize:12 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
            <Bar dataKey="disponible" fill="#6BCB77" radius={[4,4,0,0]} name="Disponible"/>
            <Bar dataKey="vendida" fill="#FF6B6B" radius={[4,4,0,0]} name="Vendida"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
