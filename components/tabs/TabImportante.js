"use client";
import { useState, useEffect, useCallback } from "react";

const CUENTAS = [
  {
    id: "zelle", label: "Zelle", icon: "💜", color: "#6B4FBB",
    bg: "linear-gradient(135deg, #f0ebff 0%, #e8deff 100%)",
    border: "#c4b5fd",
    info: [
      { label: "Titular", val: "Poner titular aquí" },
      { label: "Número / Email", val: "Poner número o email aquí" },
      { label: "Banco", val: "Poner banco aquí" },
    ],
    nota: "Disponible solo para usuarios con cuenta bancaria en EE.UU.",
  },
  {
    id: "paypal", label: "PayPal", icon: "🔵", color: "#003087",
    bg: "linear-gradient(135deg, #e8f0ff 0%, #d6e4ff 100%)",
    border: "#93c5fd",
    info: [
      { label: "Cuenta", val: "Poner cuenta PayPal aquí" },
      { label: "Titular", val: "Poner titular aquí" },
    ],
    nota: "Enviar como 'Familiares y amigos' para evitar comisiones.",
  },
  {
    id: "pagomovil", label: "Pago Móvil", icon: "🏦", color: "#1a6b3c",
    bg: "linear-gradient(135deg, #e8f5ee 0%, #d1edd9 100%)",
    border: "#86efac",
    info: [
      { label: "Banco", val: "Poner banco aquí" },
      { label: "Teléfono", val: "Poner teléfono aquí" },
      { label: "Cédula / RIF", val: "Poner cédula o RIF aquí" },
    ],
    nota: "Solo transferencias en Bolívares desde bancos venezolanos.",
  },
  {
    id: "zinli", label: "Zinli", icon: "🟢", color: "#00875a",
    bg: "linear-gradient(135deg, #e3f9ee 0%, #cff4e3 100%)",
    border: "#6ee7b7",
    info: [
      { label: "Usuario / Email", val: "Poner usuario Zinli aquí" },
      { label: "Titular", val: "Poner titular aquí" },
    ],
    nota: "Billetera digital en USD disponible en Venezuela.",
  },
  {
    id: "binance", label: "Binance Pay", icon: "🟡", color: "#b7791f",
    bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    border: "#fcd34d",
    info: [
      { label: "Pay ID / Usuario", val: "Poner Pay ID aquí" },
      { label: "Email de cuenta", val: "Poner email aquí" },
    ],
    nota: "Pago instantáneo en USDT/USDC. Recomendado para crypto.",
  },
];

export default function TabImportante({ st }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [calcMode, setCalcMode] = useState("bs_to_usd");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasas");
      const d = await res.json();
      if (d.ok) {
        setData(d);
        const now = new Date();
        const entry = {
          hora: now.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          usd: d.bcv?.usd, eur: d.bcv?.eur, usdt: d.p2pUsdt,
        };
        setHistorial(prev => [entry, ...prev].slice(0, 8));
        setLastUpdate(entry.hora);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function calcular(input) {
    const val = parseFloat(input);
    if (!val || !data) { setCalcResult(null); return; }
    const bcvUsd = data.bcv?.usd || 1;
    const bcvEur = data.bcv?.eur || 1;
    const p2p = data.p2pUsdt || bcvUsd;
    const modos = {
      bs_to_usd: { label: "USD (BCV)", value: val / bcvUsd, extra: `EUR: ${(val/bcvEur).toFixed(2)} · USDT P2P: ${(val/p2p).toFixed(2)}` },
      usd_to_bs: { label: "Bolívares (BCV)", value: val * bcvUsd, extra: `P2P: Bs ${(val*p2p).toFixed(2)}` },
      eur_to_bs: { label: "Bolívares (BCV)", value: val * bcvEur, extra: `En USD: $${(val*bcvEur/bcvUsd).toFixed(2)}` },
      usdt_to_bs: { label: "Bolívares (P2P)", value: val * p2p, extra: `BCV: Bs ${(val*bcvUsd).toFixed(2)}` },
    };
    setCalcResult(modos[calcMode]);
  }

  function copyToClipboard(text, id) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const fmt = n => n ? `Bs ${Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const spread = data?.bcv?.usd && data?.p2pUsdt ? ((data.p2pUsdt - data.bcv.usd) / data.bcv.usd * 100).toFixed(1) : null;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* Tasas — diseño moderno claro */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>Tasas del día</div>
          {lastUpdate && <div style={{ fontSize:11, color:"#888" }}>Actualizado: {lastUpdate}</div>}
        </div>
        <button onClick={cargar} disabled={loading} style={{ padding:"8px 18px", borderRadius:20, border:"1.5px solid #e5e5e0", background:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", color:"#333" }}>
          {loading ? "Actualizando..." : "↺ Refrescar"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"USD · BCV", val:data?.bcv?.usd, sub:"Oficial", color:"#3b82f6", lightBg:"#eff6ff", border:"#bfdbfe" },
          { label:"EUR · BCV", val:data?.bcv?.eur, sub:"Oficial", color:"#7c3aed", lightBg:"#f5f3ff", border:"#ddd6fe" },
          { label:"USDT · P2P", val:data?.p2pUsdt, sub:"Binance Venezuela", color:"#d97706", lightBg:"#fffbeb", border:"#fde68a" },
          { label:"USDC · P2P", val:data?.p2pUsdc, sub:"Binance Venezuela", color:"#059669", lightBg:"#f0fdf4", border:"#bbf7d0" },
        ].map(t => (
          <div key={t.label} style={{ background:t.lightBg, border:`1.5px solid ${t.border}`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ fontSize:10, color:"#666", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6, fontWeight:600 }}>{t.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:t.color, lineHeight:1.1, fontVariantNumeric:"tabular-nums" }}>
              {loading ? "···" : (t.val ? fmt(t.val) : "N/D")}
            </div>
            <div style={{ fontSize:10, color:"#999", marginTop:4 }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {spread && (
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <div style={{ background:"#fff7ed", border:"1.5px solid #fed7aa", borderRadius:12, padding:"10px 16px", flex:1, minWidth:140 }}>
            <div style={{ fontSize:10, color:"#9a3412", textTransform:"uppercase", fontWeight:600, marginBottom:2 }}>Spread P2P vs BCV</div>
            <div style={{ fontSize:22, fontWeight:700, color:Number(spread)>0?"#dc2626":"#16a34a" }}>{Number(spread)>0?"+":""}{spread}%</div>
          </div>
          {data?.bcv?.fecha && (
            <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"10px 16px", flex:1, minWidth:140 }}>
              <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", fontWeight:600, marginBottom:2 }}>Publicación BCV</div>
              <div style={{ fontSize:14, fontWeight:600, color:"#334155" }}>{data.bcv.fecha}</div>
            </div>
          )}
          {data?.bcv?.usd && data?.p2pUsdt && (
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:12, padding:"10px 16px", flex:1, minWidth:140 }}>
              <div style={{ fontSize:10, color:"#991b1b", textTransform:"uppercase", fontWeight:600, marginBottom:2 }}>Diferencia por $100</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#dc2626" }}>{fmt(Math.abs(data.p2pUsdt - data.bcv.usd) * 100)}</div>
            </div>
          )}
        </div>
      )}

      {/* Calculadora e Historial */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        <div style={{ background:"#fff", border:"1.5px solid #e5e5e0", borderRadius:14, padding:"20px 22px" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>🧮 Calculadora</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
            {[
              { id:"bs_to_usd", label:"Bs → $" },
              { id:"usd_to_bs", label:"$ → Bs" },
              { id:"eur_to_bs", label:"€ → Bs" },
              { id:"usdt_to_bs", label:"₮ → Bs" },
            ].map(m => (
              <button key={m.id} onClick={() => { setCalcMode(m.id); setCalcResult(null); setCalcInput(""); }}
                style={{ padding:"7px", borderRadius:8, border:"1.5px solid", fontSize:11, fontWeight:600, cursor:"pointer",
                  borderColor:calcMode===m.id?"#3b82f6":"#e5e5e0",
                  background:calcMode===m.id?"#eff6ff":"#f9f9f6",
                  color:calcMode===m.id?"#1d4ed8":"#666" }}>
                {m.label}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Ingresa el monto..." value={calcInput}
            onChange={e => { setCalcInput(e.target.value); calcular(e.target.value); }}
            style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:"1.5px solid #e5e5e0", fontSize:15, outline:"none", boxSizing:"border-box", fontVariantNumeric:"tabular-nums" }}/>
          {calcResult && (
            <div style={{ marginTop:10, padding:"12px 14px", background:"#f0fdf4", borderRadius:8, border:"1.5px solid #bbf7d0" }}>
              <div style={{ fontSize:10, color:"#166534", textTransform:"uppercase", fontWeight:600, marginBottom:3 }}>{calcResult.label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:"#15803d", fontVariantNumeric:"tabular-nums" }}>
                {Number(calcResult.value).toLocaleString("es-VE", { maximumFractionDigits: 2 })}
              </div>
              {calcResult.extra && <div style={{ fontSize:11, color:"#4ade80", marginTop:4 }}>{calcResult.extra}</div>}
            </div>
          )}
        </div>

        <div style={{ background:"#fff", border:"1.5px solid #e5e5e0", borderRadius:14, padding:"20px 22px" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>📈 Historial de sesión</div>
          {historial.length===0 ? (
            <div style={{ fontSize:12, color:"#aaa", textAlign:"center", paddingTop:20 }}>Las consultas de la sesión aparecerán aquí</div>
          ) : (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginBottom:8 }}>
                {["Hora","USD","EUR","USDT"].map(h => (
                  <div key={h} style={{ fontSize:9, color:"#aaa", textTransform:"uppercase", fontWeight:600, letterSpacing:"0.08em" }}>{h}</div>
                ))}
              </div>
              {historial.map((h, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, padding:"7px 0", borderBottom:"1px solid #f0f0ec" }}>
                  <div style={{ fontSize:11, color:"#888", fontVariantNumeric:"tabular-nums" }}>{h.hora}</div>
                  <div style={{ fontSize:11, color:"#3b82f6", fontVariantNumeric:"tabular-nums" }}>{h.usd?.toFixed(2)||"—"}</div>
                  <div style={{ fontSize:11, color:"#7c3aed", fontVariantNumeric:"tabular-nums" }}>{h.eur?.toFixed(2)||"—"}</div>
                  <div style={{ fontSize:11, color:"#d97706", fontVariantNumeric:"tabular-nums" }}>{h.usdt?.toFixed(2)||"—"}</div>
                </div>
              ))}
              <div style={{ fontSize:9, color:"#ccc", marginTop:8 }}>Valores en Bs por unidad · Solo esta sesión</div>
            </div>
          )}
        </div>
      </div>

      {/* Cuentas de pago */}
      <div style={{ marginBottom:12, fontSize:14, fontWeight:700 }}>💳 Nuestras cuentas de pago</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {CUENTAS.map(cuenta => (
          <div key={cuenta.id} style={{ background:cuenta.bg, border:`1.5px solid ${cuenta.border}`, borderRadius:14, padding:"18px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>{cuenta.icon}</span>
              <div style={{ fontSize:14, fontWeight:700, color:cuenta.color }}>{cuenta.label}</div>
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:10 }}>
              {cuenta.info.map((inf, i) => (
                <div key={i} style={{ flex:"1 1 160px" }}>
                  <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", fontWeight:600, letterSpacing:"0.07em", marginBottom:3 }}>{inf.label}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{inf.val}</span>
                    <button onClick={() => copyToClipboard(inf.val, `${cuenta.id}_${i}`)}
                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, opacity:0.5, padding:0 }}
                      title="Copiar">
                      {copiedId===`${cuenta.id}_${i}` ? "✓" : "📋"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:"#666", background:"rgba(255,255,255,0.6)", borderRadius:6, padding:"6px 10px" }}>
              ℹ️ {cuenta.nota}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
