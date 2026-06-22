"use client";
import { useState, useEffect } from "react";
import { G1, G2 } from "../../lib/constants";

const BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

async function fetchBinanceP2P(asset) {
  const res = await fetch(BINANCE_P2P_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset, fiat:"VES", merchantCheck:false, page:1, rows:3, tradeType:"SELL", countries:[], proMerchantAds:false }),
  });
  const data = await res.json();
  const prices = (data.data||[]).map((d)=>parseFloat(d.adv?.price||0)).filter(Boolean);
  if(!prices.length)return null;
  return prices.reduce((a,b)=>a+b,0)/prices.length;
}

async function fetchBCV() {
  const res = await fetch("https://rates.dolarvzla.com/bcv/current.json",{ cache:"no-store" });
  const data = await res.json();
  return { usd:data.current?.usd, eur:data.current?.eur, fecha:data.current?.date };
}

export default function TabImportante({ st }) {
  const [bcv, setBcv] = useState(null);
  const [p2pUsdt, setP2pUsdt] = useState(null);
  const [p2pUsdc, setP2pUsdc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function cargar() {
    setLoading(true);
    try {
      const [bcvData, usdt, usdc] = await Promise.all([
        fetchBCV().catch(()=>null),
        fetchBinanceP2P("USDT").catch(()=>null),
        fetchBinanceP2P("USDC").catch(()=>null),
      ]);
      setBcv(bcvData); setP2pUsdt(usdt); setP2pUsdc(usdc);
      setLastUpdate(new Date().toLocaleTimeString("es-VE",{ hour:"2-digit", minute:"2-digit" }));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ cargar(); },[]);

  const fmt2 = (n) => n ? `Bs ${Number(n).toLocaleString("es-VE",{ minimumFractionDigits:2, maximumFractionDigits:2 })}` : "N/D";

  const TasaCard = ({ titulo, valor, sub, color, fuente }) => (
    <div style={{ ...st.card, borderTop:`4px solid ${color}`, flex:1, minWidth:160 }}>
      <div style={{ fontSize:11, color:G2, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{titulo}</div>
      <div style={{ fontSize:30, fontWeight:700, color:loading?G2:color==="#FFF200"?"#000":color }}>{loading?"...":valor??"N/D"}</div>
      {sub&&<div style={{ fontSize:12, color:G1, marginTop:4 }}>{sub}</div>}
      {fuente&&<div style={{ fontSize:10, color:G2, marginTop:8 }}>{fuente}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>Tasas del día</div>
          {lastUpdate&&<div style={{ fontSize:11, color:G2 }}>Actualizado a las {lastUpdate}</div>}
        </div>
        <button style={st.btn(true)} onClick={cargar} disabled={loading}>{loading?"Actualizando...":"🔄 Refrescar"}</button>
      </div>

      <div style={{ marginBottom:10, fontSize:12, fontWeight:700, color:G1, textTransform:"uppercase" }}>
        Banco Central de Venezuela (BCV){bcv?.fecha&&<span style={{ fontWeight:400, marginLeft:8 }}>publicado: {bcv.fecha}</span>}
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:24 }}>
        <TasaCard titulo="USD · BCV" valor={fmt2(bcv?.usd)} sub="1 dólar americano" color="#4D96FF" fuente="Fuente: dolarvzla.com · BCV"/>
        <TasaCard titulo="EUR · BCV" valor={fmt2(bcv?.eur)} sub="1 euro" color="#6BCB77" fuente="Fuente: dolarvzla.com · BCV"/>
      </div>

      <div style={{ marginBottom:10, fontSize:12, fontWeight:700, color:G1, textTransform:"uppercase" }}>
        Binance P2P — Venezuela (promedio 3 mejores anuncios)
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:24 }}>
        <TasaCard titulo="USDT · P2P" valor={fmt2(p2pUsdt)} sub="1 USDT en bolívares" color="#F3BA2F" fuente="Fuente: Binance P2P Venezuela"/>
        <TasaCard titulo="USDC · P2P" valor={fmt2(p2pUsdc)} sub="1 USDC en bolívares" color="#B983FF" fuente="Fuente: Binance P2P Venezuela"/>
      </div>

      {bcv?.usd && (p2pUsdt||p2pUsdc) && (
        <div style={st.card}>
          <div style={st.sTitle}>Comparativa</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Fuente","1 USD en Bs","Diferencia vs BCV"].map((h)=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                { fuente:"BCV Oficial", valor:bcv.usd, color:"#4D96FF" },
                p2pUsdt&&{ fuente:"Binance P2P USDT", valor:p2pUsdt, color:"#F3BA2F" },
                p2pUsdc&&{ fuente:"Binance P2P USDC", valor:p2pUsdc, color:"#B983FF" },
              ].filter(Boolean).map((row)=>{
                const diff = row.valor-bcv.usd;
                const pct = ((diff/bcv.usd)*100).toFixed(1);
                return (
                  <tr key={row.fuente}>
                    <td style={st.td}><strong style={{ color:row.color }}>{row.fuente}</strong></td>
                    <td style={st.td}><strong>{fmt2(row.valor)}</strong></td>
                    <td style={st.td}><span style={{ color:diff>0?"#b30000":"#1a7a1a", fontWeight:600 }}>{diff>0?"+":""}{fmt2(diff)} ({pct}%)</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize:11, color:G2, marginTop:10 }}>Diferencia positiva = P2P por encima del BCV oficial.</div>
        </div>
      )}
    </div>
  );
}
