"use client";
import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "var(--bg, #0a0a0f)",
  card: "#111118",
  border: "#1e1e2a",
  gold: "#c9a84c",
  goldLight: "#e8c97a",
  blue: "#4a90d9",
  green: "#34c97a",
  red: "#e05555",
  gray: "#888",
  white: "#f0f0f0",
};

const mono = { fontFamily: "'SF Mono','Fira Code','Fira Mono','Roboto Mono',monospace" };

export default function TabImportante({ st }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [calcMode, setCalcMode] = useState("bs_to_usd");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState(null);

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
          fecha: now.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" }),
          usd: d.bcv?.usd,
          eur: d.bcv?.eur,
          usdt: d.p2pUsdt,
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
    if (calcMode === "bs_to_usd") setCalcResult({ label: "USD (BCV)", value: val / bcvUsd, extra: `EUR: ${(val/bcvEur).toFixed(2)} · USDT P2P: ${(val/p2p).toFixed(2)}` });
    if (calcMode === "usd_to_bs") setCalcResult({ label: "Bolívares (BCV)", value: val * bcvUsd, extra: `P2P: Bs ${(val*p2p).toFixed(2)}` });
    if (calcMode === "eur_to_bs") setCalcResult({ label: "Bolívares (BCV)", value: val * bcvEur, extra: `En USD: $${(val*bcvEur/bcvUsd).toFixed(2)}` });
    if (calcMode === "usdt_to_bs") setCalcResult({ label: "Bolívares (P2P)", value: val * p2p, extra: `BCV: Bs ${(val*bcvUsd).toFixed(2)}` });
  }

  const fmt = n => n ? `Bs ${Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const fmtN = n => n ? Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  const diff = (a, b) => {
    if (!a || !b) return null;
    const d = ((a - b) / b * 100).toFixed(1);
    return { val: d, pos: d > 0 };
  };

  const spread = data ? diff(data.p2pUsdt, data.bcv?.usd) : null;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {/* Header bar */}
      <div style={{ background: "#000", borderRadius: 14, padding: "18px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: loading ? "#888" : C.green, boxShadow: loading ? "none" : `0 0 8px ${C.green}` }} />
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>Monitor de Tasas</div>
            <div style={{ color: "#555", fontSize: 11 }}>{lastUpdate ? `Última actualización: ${lastUpdate}` : "Cargando..."}</div>
          </div>
        </div>
        <button onClick={cargar} disabled={loading} style={{ background: "none", border: `1px solid #333`, borderRadius: 8, color: loading ? "#555" : C.gold, fontSize: 12, cursor: "pointer", padding: "7px 16px", fontWeight: 600 }}>
          {loading ? "Actualizando..." : "↺ Refrescar"}
        </button>
      </div>

      {/* Tasas principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "USD · BCV", val: data?.bcv?.usd, fmt: fmt, sub: "Oficial", color: C.blue, symbol: "$" },
          { label: "EUR · BCV", val: data?.bcv?.eur, fmt: fmt, sub: "Oficial", color: "#a78bfa", symbol: "€" },
          { label: "USDT · P2P", val: data?.p2pUsdt, fmt: fmt, sub: "Binance Venezuela", color: C.gold, symbol: "₮" },
          { label: "USDC · P2P", val: data?.p2pUsdc, fmt: fmt, sub: "Binance Venezuela", color: "#60d394", symbol: "₵" },
        ].map(t => (
          <div key={t.label} style={{ background: "#000", border: `1px solid #1a1a1a`, borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: t.color, borderRadius: "12px 12px 0 0" }} />
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>{t.label}</div>
            <div style={{ fontSize: loading ? 18 : 26, fontWeight: 700, color: t.color, ...mono, lineHeight: 1.1 }}>
              {loading ? "···" : (t.val ? fmt(t.val) : "N/D")}
            </div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Spread BCV vs P2P + fecha BCV */}
      {data?.bcv?.usd && (
        <div style={{ background: "#000", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {data.bcv.fecha && (
            <div>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Publicación BCV</div>
              <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{data.bcv.fecha}</div>
            </div>
          )}
          {spread && (
            <div>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Spread P2P vs BCV</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: spread.pos ? C.red : C.green, ...mono }}>
                {spread.pos ? "+" : ""}{spread.val}%
              </div>
              <div style={{ fontSize: 11, color: "#444" }}>{spread.pos ? "P2P está sobre el oficial" : "P2P está bajo el oficial"}</div>
            </div>
          )}
          {data.bcv?.usd && data.p2pUsdt && (
            <div>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Diferencia por $100</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.gold, ...mono }}>
                {fmt(Math.abs(data.p2pUsdt - data.bcv.usd) * 100)}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Calculadora */}
        <div style={{ background: "#000", border: "1px solid #1a1a1a", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>🧮 Calculadora</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[
              { id: "bs_to_usd", label: "Bs → USD" },
              { id: "usd_to_bs", label: "USD → Bs" },
              { id: "eur_to_bs", label: "EUR → Bs" },
              { id: "usdt_to_bs", label: "USDT → Bs" },
            ].map(m => (
              <button key={m.id} onClick={() => { setCalcMode(m.id); setCalcResult(null); setCalcInput(""); }}
                style={{ padding: "8px 10px", borderRadius: 7, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s", borderColor: calcMode === m.id ? C.gold : "#222", background: calcMode === m.id ? C.gold : "#0a0a0a", color: calcMode === m.id ? "#000" : "#666" }}>
                {m.label}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Ingresa el monto..."
            value={calcInput}
            onChange={e => { setCalcInput(e.target.value); calcular(e.target.value); }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #222", background: "#080808", color: C.white, fontSize: 16, outline: "none", boxSizing: "border-box", ...mono }}
          />
          {calcResult && (
            <div style={{ marginTop: 12, padding: "12px 14px", background: "#0d0d0d", borderRadius: 8, border: `1px solid ${C.gold}22` }}>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", marginBottom: 4 }}>{calcResult.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, ...mono }}>{typeof calcResult.value === "number" ? Number(calcResult.value).toLocaleString("es-VE", { maximumFractionDigits: 2 }) : calcResult.value}</div>
              {calcResult.extra && <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>{calcResult.extra}</div>}
            </div>
          )}
          {!data && !loading && <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Carga las tasas primero para calcular.</div>}
        </div>

        {/* Historial */}
        <div style={{ background: "#000", border: "1px solid #1a1a1a", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>📈 Historial de sesión</div>
          {historial.length === 0 ? (
            <div style={{ fontSize: 12, color: "#444", marginTop: 24, textAlign: "center" }}>Las tasas consultadas durante esta sesión aparecerán aquí.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                {["Hora", "USD", "EUR", "USDT"].map(h => (
                  <div key={h} style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</div>
                ))}
              </div>
              {historial.map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, padding: "8px 0", borderBottom: "1px solid #111" }}>
                  <div style={{ fontSize: 11, color: "#555", ...mono }}>{h.hora}</div>
                  <div style={{ fontSize: 11, color: C.blue, ...mono }}>{h.usd ? h.usd.toFixed(2) : "—"}</div>
                  <div style={{ fontSize: 11, color: "#a78bfa", ...mono }}>{h.eur ? h.eur.toFixed(2) : "—"}</div>
                  <div style={{ fontSize: 11, color: C.gold, ...mono }}>{h.usdt ? h.usdt.toFixed(2) : "—"}</div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: "#333", marginTop: 8 }}>Los valores son en Bs por unidad. Historial solo de esta sesión.</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla comparativa */}
      {data?.bcv?.usd && (
        <div style={{ background: "#000", border: "1px solid #1a1a1a", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Tabla comparativa — equivalencias de 1 USD</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Fuente", "1 USD equivale a", "vs BCV", "Confiabilidad"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px 10px 0", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { fuente: "BCV Oficial", val: data.bcv.usd, color: C.blue, conf: "Oficial", confColor: C.green },
                  data.p2pUsdt ? { fuente: "Binance P2P USDT", val: data.p2pUsdt, color: C.gold, conf: "Mercado", confColor: C.gold } : null,
                  data.p2pUsdc ? { fuente: "Binance P2P USDC", val: data.p2pUsdc, color: "#60d394", conf: "Mercado", confColor: C.gold } : null,
                  data.bcv.eur ? { fuente: "EUR → USD (BCV)", val: data.bcv.eur / (data.bcv.usd / data.bcv.usd), color: "#a78bfa", conf: "Referencial", confColor: "#888", isEur: true } : null,
                ].filter(Boolean).map((row, i) => {
                  const d = row.val && data.bcv.usd ? ((row.val - data.bcv.usd) / data.bcv.usd * 100) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #0d0d0d" }}>
                      <td style={{ padding: "12px 12px 12px 0", fontSize: 13, color: row.color, fontWeight: 600 }}>{row.fuente}</td>
                      <td style={{ padding: "12px 12px 12px 0", fontSize: 14, fontWeight: 700, color: C.white, ...mono }}>{fmt(row.val)}</td>
                      <td style={{ padding: "12px 12px 12px 0", fontSize: 12, color: d === 0 ? "#444" : d > 0 ? C.red : C.green, fontWeight: 600, ...mono }}>
                        {d === 0 ? "—" : `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: `1px solid ${row.confColor}33`, color: row.confColor }}>{row.conf}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: "#333", marginTop: 12 }}>Datos obtenidos en tiempo real · BCV: dolarvzla.com · P2P: Binance Venezuela</div>
        </div>
      )}
    </div>
  );
}
