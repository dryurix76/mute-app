// Esta ruta corre en el servidor (Vercel), no en el navegador.
// Resuelve el problema de CORS que bloquea las llamadas a Binance P2P y DolarVZLA
// cuando se hacen directamente desde el navegador.

async function fetchBCV() {
  const res = await fetch("https://rates.dolarvzla.com/bcv/current.json", { cache:"no-store" });
  if(!res.ok) return null;
  const d = await res.json();
  return { usd:d.current?.usd, eur:d.current?.eur, fecha:d.current?.date };
}

async function fetchBinanceP2P(asset) {
  const res = await fetch("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ asset, fiat:"VES", merchantCheck:false, page:1, rows:3, tradeType:"SELL", countries:[], proMerchantAds:false }),
    cache:"no-store",
  });
  if(!res.ok) return null;
  const d = await res.json();
  const prices = (d.data||[]).map((x)=>parseFloat(x.adv?.price||0)).filter(Boolean);
  return prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : null;
}

export async function GET() {
  try {
    const [bcv, usdt, usdc] = await Promise.allSettled([
      fetchBCV(),
      fetchBinanceP2P("USDT"),
      fetchBinanceP2P("USDC"),
    ]);
    return Response.json({
      ok:true,
      bcv: bcv.status==="fulfilled" ? bcv.value : null,
      p2pUsdt: usdt.status==="fulfilled" ? usdt.value : null,
      p2pUsdc: usdc.status==="fulfilled" ? usdc.value : null,
    });
  } catch(e) {
    return Response.json({ ok:false, error:e.message }, { status:500 });
  }
}
