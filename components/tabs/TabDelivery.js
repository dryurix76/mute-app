"use client";
import { useState, useMemo } from "react";
import { G1, G2, MODELOS, RIDERY_ESTADO_COLOR, RIDERY_ESTADOS } from "../../lib/constants";

const CONDUCTORES = ["Carlos Pérez 🛵","María Gómez 🛵","Luis Hernández 🛵","Andrea Salas 🛵","Roberto Silva 🛵"];
const ZONAS_CARACAS = ["Las Mercedes","Chacao","Altamira","La Castellana","Bello Monte","Los Palos Grandes","Sebucán","El Rosal","Chuao","La Florida","Chulavista","Miraflores"];
const FORMAS_PAGO_RIDERY = ["Zelle","Binance Pay","Kontigo","Zinli","Pago Móvil"];
const COSTO_DELIVERY = 5;

function simularOrden(ventaId, idx) {
  const seed = (ventaId||"").toString().split("").reduce((a,c)=>a+c.charCodeAt(0), idx*7);
  const estadosPosibles = ["Entregado","Entregado","En camino","Conductor asignado","Pendiente","Incidencia"];
  const estado = estadosPosibles[seed % estadosPosibles.length];
  const origen = ZONAS_CARACAS[seed % ZONAS_CARACAS.length];
  const destino = ZONAS_CARACAS[(seed+3) % ZONAS_CARACAS.length];
  return {
    trackingId: `RID-${100000+(seed%900000)}`,
    estado,
    conductor: CONDUCTORES[seed % CONDUCTORES.length],
    eta: estado==="En camino" ? "12-18 min" : estado==="Conductor asignado" ? "25-35 min" : null,
    origen,
    destino,
    formaPago: FORMAS_PAGO_RIDERY[seed % FORMAS_PAGO_RIDERY.length],
    costoDelivery: COSTO_DELIVERY,
    incidencias: estado==="Incidencia" ? [{ texto:"Cliente no contestó el teléfono en la dirección indicada", fecha:"Hoy 6:50 pm" }] : [],
    timeline: [
      { estado:"Pedido recibido", hora:"Hoy 2:00 pm", ok:true },
      { estado:"Conductor asignado", hora:"Hoy 2:08 pm", ok:["Conductor asignado","En camino","Entregado","Incidencia"].includes(estado) },
      { estado:"En camino", hora:"Hoy 2:22 pm", ok:["En camino","Entregado"].includes(estado) },
      { estado:"Entregado", hora:estado==="Entregado"?"Hoy 2:45 pm":"—", ok:estado==="Entregado" },
    ],
  };
}

export default function TabDelivery({ st, fmt, ventas }) {
  const [filterEstado, setFilterEstado] = useState("all");
  const [expandido, setExpandido] = useState(null);

  const pedidos = useMemo(()=>
    ventas.filter((v)=>(v.delivery||"Local")==="Local").map((v,idx)=>({
      ventaId:v.id, codigo:v.codigo, comprador:v.comprador,
      telefono:v.telefono, ciudad:v.ciudad,
      modelo:MODELOS.find((m)=>m.id===v.modelo)?.nombre||"",
      fecha:v.fecha,
      ...simularOrden(v.id, idx),
    }))
  ,[ventas]);

  const filtrados = pedidos.filter((p)=>filterEstado==="all"||p.estado===filterEstado);
  const stats = {
    total: pedidos.length,
    transit: pedidos.filter((p)=>p.estado==="En camino"||p.estado==="Conductor asignado").length,
    entregados: pedidos.filter((p)=>p.estado==="Entregado").length,
    incidencias: pedidos.filter((p)=>p.estado==="Incidencia").length,
    ingresosDelivery: pedidos.length * COSTO_DELIVERY,
  };

  return (
    <div>
      {/* Header estilo Ridery 360 */}
      <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
        <div style={{ fontSize:22, fontWeight:700, color:"#1a1a1a", fontFamily:"sans-serif" }}>
          Ridery<span style={{ color:"#0f766e" }}>360</span>
        </div>
        <div style={{ width:1, height:30, background:"#e5e5e0" }}/>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontSize:12, color:"#666" }}>Gestión de envíos locales · Caracas</div>
          <div style={{ fontSize:11, color:"#888" }}>Simulación — lista para conectar con la API corporativa</div>
        </div>
        <div style={{ display:"flex", gap:16 }}>
          {[
            { label:"Balance Ridery", val:`$${(stats.total*2).toFixed(2)}`, color:"#0f766e" },
            { label:"Envíos del mes", val:stats.total, color:"#1a1a1a" },
          ].map((s)=>(
            <div key={s.label} style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:"#888" }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div style={st.statsRow}>
        {[
          { label:"Pedidos Locales", val:stats.total, color:"#000" },
          { label:"En Tránsito", val:stats.transit, color:"#4D96FF" },
          { label:"Entregados", val:stats.entregados, color:"#6BCB77" },
          { label:"Incidencias", val:stats.incidencias, color:"#FF6B6B" },
          { label:`Ingresos Delivery ($${COSTO_DELIVERY} c/u)`, val:fmt(stats.ingresosDelivery), color:"#FFF200" },
        ].map((s)=>(
          <div key={s.label} style={{ ...st.statCard, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:11, color:G2, textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color==="#FFF200"?"#000":s.color==="#000"?"#000":s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={st.grid2}>
        {/* Lista de pedidos */}
        <div>
          <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
            <select style={{ ...st.sel, width:200 }} value={filterEstado} onChange={(e)=>setFilterEstado(e.target.value)}>
              <option value="all">Estado: Todos</option>
              <option value="Pendiente">Pendiente</option>
              {RIDERY_ESTADOS.map((e)=><option key={e} value={e}>{e}</option>)}
            </select>
            <span style={{ fontSize:13, color:G1 }}>{filtrados.length} pedidos</span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtrados.length===0 && (
              <div style={{ ...st.card, textAlign:"center", padding:24, color:G2 }}>No hay pedidos de delivery local.</div>
            )}
            {filtrados.map((p)=>{
              const clr = RIDERY_ESTADO_COLOR[p.estado]||{ bg:"#f0f0ec", text:G1 };
              const isOpen = expandido===p.ventaId;
              return (
                <div key={p.ventaId} style={{ ...st.card, borderLeft:`4px solid ${clr.text}`, cursor:"pointer" }}
                  onClick={()=>setExpandido(isOpen?null:p.ventaId)}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <strong style={{ fontSize:13 }}>{p.comprador}</strong>
                        <code style={{ fontSize:10, background:"#f5f5f0", padding:"2px 6px", borderRadius:3 }}>{p.codigo}</code>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:clr.bg, color:clr.text }}>{p.estado}</span>
                      </div>
                      <div style={{ fontSize:11, color:G1 }}>{p.modelo} · {p.fecha}</div>
                      <div style={{ fontSize:11, color:G1, marginTop:2 }}>🚏 {p.origen} → 📍 {p.destino}</div>
                      {p.conductor && <div style={{ fontSize:11, color:G1 }}>{p.conductor}{p.eta&&` · ETA ${p.eta}`}</div>}
                      <div style={{ fontSize:11, color:G1, marginTop:2 }}>
                        🔖 {p.trackingId} · 💳 {p.formaPago} · <strong style={{ color:"#1a7a1a" }}>{fmt(p.costoDelivery)}</strong>
                      </div>
                      {p.incidencias.length>0 && (
                        <div style={{ marginTop:8, background:"#fde8e8", borderRadius:8, padding:"6px 10px" }}>
                          {p.incidencias.map((inc,i)=><div key={i} style={{ fontSize:11, color:"#8a0000" }}>⚠️ {inc.texto} · {inc.fecha}</div>)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:16, color:G2, alignSelf:"flex-start" }}>{isOpen?"▲":"▼"}</div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop:14, borderTop:"1px solid #eee", paddingTop:14 }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Trazabilidad del envío</div>
                      <div style={{ position:"relative", paddingLeft:24 }}>
                        {p.timeline.map((t,idx)=>(
                          <div key={idx} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14, position:"relative" }}>
                            <div style={{ position:"absolute", left:-16, top:2, width:16, height:16, borderRadius:"50%", background:t.ok?"#6BCB77":"#e0e0e0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, flexShrink:0, color:t.ok?"#fff":"#aaa" }}>{t.ok?"✓":"·"}</div>
                            {idx<p.timeline.length-1 && <div style={{ position:"absolute", left:-9, top:18, width:2, height:20, background:t.ok?"#6BCB77":"#e0e0e0" }}/>}
                            <div>
                              <div style={{ fontSize:12, fontWeight:t.ok?700:400, color:t.ok?"#000":G2 }}>{t.estado}</div>
                              <div style={{ fontSize:11, color:G2 }}>{t.hora}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:"#f9f9f6", borderRadius:8, padding:"10px 14px", marginTop:6 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:11 }}>
                          <div><span style={{ color:G2 }}>Comprador:</span> <strong>{p.comprador}</strong></div>
                          <div><span style={{ color:G2 }}>Teléfono:</span> {p.telefono||"—"}</div>
                          <div><span style={{ color:G2 }}>Origen:</span> {p.origen}, Caracas</div>
                          <div><span style={{ color:G2 }}>Destino:</span> {p.destino}, Caracas</div>
                          <div><span style={{ color:G2 }}>Conductor:</span> {p.conductor}</div>
                          <div><span style={{ color:G2 }}>Forma de pago:</span> {p.formaPago}</div>
                          <div><span style={{ color:G2 }}>Tracking ID:</span> <strong>{p.trackingId}</strong></div>
                          <div><span style={{ color:G2 }}>Costo delivery:</span> <strong style={{ color:"#1a7a1a" }}>{fmt(p.costoDelivery)}</strong></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel derecho estilo Ridery */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#f8fafc", borderRadius:12, padding:20, color:"#1a1a1a" }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14, color:"#0f766e" }}>📊 Resumen Ridery 360</div>
            {RIDERY_ESTADOS.map((e)=>{
              const c=pedidos.filter((p)=>p.estado===e).length;
              const pct=pedidos.length?Math.round(c/pedidos.length*100):0;
              const clr=RIDERY_ESTADO_COLOR[e]||{ bg:"#333", text:"#888" };
              return (
                <div key={e} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                    <span style={{ color:"#666" }}>{e}</span>
                    <span style={{ color:clr.text, fontWeight:700 }}>{c} ({pct}%)</span>
                  </div>
                  <div style={{ height:4, background:"#e5e5e0", borderRadius:4 }}>
                    <div style={{ height:4, width:`${pct}%`, background:clr.text, borderRadius:4, transition:"width .3s" }}/>
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop:"1px solid #e5e5e0", marginTop:14, paddingTop:14 }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:8 }}>Métodos de pago</div>
              {FORMAS_PAGO_RIDERY.map((f)=>{
                const c=pedidos.filter((p)=>p.formaPago===f).length;
                if(!c)return null;
                return <div key={f} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#666", marginBottom:4 }}><span>{f}</span><strong>{c}</strong></div>;
              })}
            </div>
            <div style={{ borderTop:"1px solid #e5e5e0", marginTop:14, paddingTop:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                <span style={{ color:"#888" }}>Total ingresos delivery</span>
                <strong style={{ color:"#0f766e" }}>{fmt(stats.ingresosDelivery)}</strong>
              </div>
              <div style={{ fontSize:10, color:"#888", marginTop:4 }}>A ${COSTO_DELIVERY} por pedido local</div>
            </div>
          </div>

          <div style={{ ...st.card }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>ℹ️ Integración Ridery 360</div>
            <div style={{ fontSize:11, color:G1, lineHeight:1.6 }}>
              Esta simulación recrea el flujo real de Ridery 360. Para activar la conexión en vivo:
            </div>
            <ol style={{ fontSize:11, color:G1, paddingLeft:18, marginTop:8, lineHeight:2 }}>
              <li>Contáctanos en <strong>ridery.app</strong> para acceso corporativo</li>
              <li>Obten tu API Key y credenciales B2B</li>
              <li>El equipo reemplaza el modo simulación con la API real (1 hora de trabajo)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
