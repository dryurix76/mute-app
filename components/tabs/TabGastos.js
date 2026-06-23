"use client";
import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { G1, G2, GASTO_CONCEPTOS } from "../../lib/constants";

const COLORS = ["#4D96FF","#FF6B6B","#6BCB77","#FFF200","#B983FF","#FFA94D","#E1306C","#25D366","#F3BA2F","#00B4D8","#FF9F43","#54A0FF"];

export default function TabGastos({ st, fmt, gastos, totalIngresos, onNew, onEdit, onDelete }) {
  const totalGastos = gastos.reduce((s,g)=>s+g.cantidad,0);

  const gastosPorConcepto = useMemo(()=>{
    const m={};
    gastos.forEach((g)=>{ m[g.concepto]=(m[g.concepto]||0)+g.cantidad; });
    return Object.entries(m).map(([name,value])=>({ name,value })).sort((a,b)=>b.value-a.value);
  },[gastos]);

  const gastosPorPago = useMemo(()=>{
    const m={};
    gastos.forEach((g)=>{ m[g.pago]=(m[g.pago]||0)+g.cantidad; });
    return Object.entries(m).map(([name,value])=>({ name,value })).sort((a,b)=>b.value-a.value);
  },[gastos]);

  const gastosPorMes = useMemo(()=>{
    const m={};
    const MESES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    gastos.forEach((g)=>{
      const d=new Date(g.fecha||Date.now());
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const lbl=`${MESES[d.getMonth()]} ${d.getFullYear()}`;
      if(!m[k])m[k]={ key:k,label:lbl,total:0 };
      m[k].total+=g.cantidad;
    });
    return Object.values(m).sort((a,b)=>a.key.localeCompare(b.key));
  },[gastos]);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12 }}>
        <div style={{ fontSize:14,color:G1 }}>{gastos.length} gastos registrados</div>
        <button style={st.btn(true)} onClick={onNew}>+ Registrar Gasto</button>
      </div>

      <div style={{ ...st.statsRow, marginBottom:16 }}>
        <div style={{ ...st.statCard,borderTop:"3px solid #FF6B6B" }}>
          <div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Total Gastos</div>
          <div style={{ fontSize:28,fontWeight:700,color:"#b30000" }}>{fmt(totalGastos)}</div>
          <div style={{ fontSize:12,color:G1 }}>{gastos.length} registros</div>
        </div>
        <div style={{ ...st.statCard,borderTop:"3px solid #6BCB77" }}>
          <div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Ingresos - Gastos</div>
          <div style={{ fontSize:28,fontWeight:700,color:"#1a7a1a" }}>{fmt(totalIngresos-totalGastos)}</div>
          <div style={{ fontSize:12,color:G1 }}>balance neto</div>
        </div>
        <div style={{ ...st.statCard,borderTop:"3px solid #4D96FF" }}>
          <div style={{ fontSize:11,color:G2,textTransform:"uppercase",marginBottom:6 }}>Mayor categoría</div>
          <div style={{ fontSize:18,fontWeight:700 }}>{gastosPorConcepto[0]?.name||"—"}</div>
          <div style={{ fontSize:12,color:G1 }}>{gastosPorConcepto[0]?fmt(gastosPorConcepto[0].value):""}</div>
        </div>
      </div>

      {gastos.length>0 && (
        <div style={st.grid2}>
          <div style={st.card}>
            <div style={st.sTitle}>Gastos por concepto</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gastosPorConcepto} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({name,value})=>`${name.split(" ")[0]}($${value.toFixed(0)})`} labelLine={false}>
                  {gastosPorConcepto.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ fontSize:12,borderRadius:8 }} formatter={(v)=>fmt(v)}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={st.card}>
            <div style={st.sTitle}>Gastos por método de pago</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gastosPorPago} layout="vertical" margin={{ top:0,right:20,left:10,bottom:0 }}>
                <XAxis type="number" tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} axisLine={false} tickLine={false} width={80}/>
                <Tooltip contentStyle={{ fontSize:12,borderRadius:8 }} formatter={(v)=>fmt(v)}/>
                <Bar dataKey="value" radius={[0,6,6,0]} name="Total">
                  {gastosPorPago.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {gastosPorMes.length>1 && (
            <div style={{ ...st.card, ...st.grid2===undefined?{}:{gridColumn:"1 / -1"} }}>
              <div style={st.sTitle}>Gastos por mes</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={gastosPorMes} margin={{ top:0,right:0,left:-20,bottom:0 }}>
                  <XAxis dataKey="label" tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ fontSize:12,borderRadius:8 }} formatter={(v)=>fmt(v)}/>
                  <Bar dataKey="total" fill="#FF6B6B" radius={[6,6,0,0]} name="Total"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div style={st.card}>
        {gastos.length===0 ? (
          <div style={{ textAlign:"center",padding:24,color:G2 }}>No hay gastos registrados.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead><tr>{["Fecha","Proveedor","Concepto","Cantidad","Pago","Factura","Acciones"].map((h)=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {gastos.map((g)=>(
                  <tr key={g.id}>
                    <td style={{ ...st.td,color:G1,fontSize:11,whiteSpace:"nowrap" }}>{g.fecha}</td>
                    <td style={st.td}><strong>{g.proveedor}</strong></td>
                    <td style={st.td}><span style={st.PC}>{g.concepto}</span></td>
                    <td style={st.td}><strong style={{ color:"#b30000" }}>{fmt(g.cantidad)}</strong></td>
                    <td style={st.td}>{g.pago}</td>
                    <td style={st.td}>{g.factura?<a href={g.factura} target="_blank" rel="noreferrer" style={{ color:"#000",textDecoration:"underline" }}>Ver 📎</a>:<span style={{ color:"#ccc" }}>—</span>}</td>
                    <td style={st.td}>
                      <div style={{ display:"flex",gap:4 }}>
                        <button style={{ ...st.btnSm(),fontSize:13,padding:"3px 8px" }} onClick={()=>onEdit(g)}>✏️</button>
                        <button style={{ ...st.btnSm("#fee"),fontSize:13,padding:"3px 8px" }} onClick={()=>onDelete(g)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...st.td,fontWeight:700 }} colSpan={3}>TOTAL</td>
                  <td style={{ ...st.td,fontWeight:700,fontSize:14,color:"#b30000" }}>{fmt(totalGastos)}</td>
                  <td style={st.td} colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
