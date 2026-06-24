"use client";
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from "recharts";
import { G1, G2 } from "../../lib/constants";

const COLORES = { pesimista:"#FF6B6B", esperado:"#4D96FF", optimista:"#6BCB77" };

const COSTOS_FIJOS_DEFAULT = [
  { id:"produccion_drop", label:"Producción Drop 002 (100 prendas)", valor:1265, tipo:"unico", icono:"👕" },
  { id:"instagram_ads", label:"Publicidad Instagram / Meta Ads", valor:150, tipo:"mensual", icono:"📱" },
  { id:"hosting", label:"Hosting Spaceship + Vercel", valor:20, tipo:"mensual", icono:"🌐" },
  { id:"claude_api", label:"API Claude (Claudio)", valor:30, tipo:"mensual", icono:"🤖" },
  { id:"desarrollo", label:"Desarrollo / mantenimiento", valor:100, tipo:"mensual", icono:"💻" },
  { id:"delivery", label:"Delivery promedio mensual", valor:75, tipo:"mensual", icono:"🛵" },
  { id:"empaque", label:"Empaque / bolsas / tags", valor:40, tipo:"mensual", icono:"📦" },
  { id:"otros", label:"Otros gastos operativos", valor:50, tipo:"mensual", icono:"📋" },
];

const ESCENARIOS = [
  { id:"pesimista", label:"Pesimista", pct:0.6, desc:"60% del inventario" },
  { id:"esperado", label:"Esperado", pct:0.8, desc:"80% del inventario" },
  { id:"optimista", label:"Optimista", pct:1.0, desc:"100% del inventario" },
];

function fmt(n) {
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TabProyecciones({ gastos, ventas, inventory }) {
  const [costosFijos, setCostosFijos] = useState(COSTOS_FIJOS_DEFAULT);
  const [costoPorPrenda, setCostoPorPrenda] = useState(12.65);
  const [precioVenta, setPrecioVenta] = useState(30);
  const [unidadesDrop, setUnidadesDrop] = useState(100);
  const [mesesProyeccion, setMesesProyeccion] = useState(3);
  const [editandoCosto, setEditandoCosto] = useState(null);
  const [nuevoCostoLabel, setNuevoCostoLabel] = useState("");
  const [nuevoCostoValor, setNuevoCostoValor] = useState("");
  const [showAddCosto, setShowAddCosto] = useState(false);

  function updateCosto(id, val) {
    setCostosFijos(prev => prev.map(c => c.id === id ? { ...c, valor: Number(val) || 0 } : c));
  }

  function deleteCosto(id) {
    setCostosFijos(prev => prev.filter(c => c.id !== id));
  }

  function addCosto() {
    if (!nuevoCostoLabel.trim() || !nuevoCostoValor) return;
    setCostosFijos(prev => [...prev, {
      id: "custom_" + Date.now(),
      label: nuevoCostoLabel.trim(),
      valor: Number(nuevoCostoValor) || 0,
      tipo: "mensual",
      icono: "💰",
    }]);
    setNuevoCostoLabel(""); setNuevoCostoValor(""); setShowAddCosto(false);
  }

  const calculos = useMemo(() => {
    const costoUnico = costosFijos.filter(c => c.tipo === "unico").reduce((s, c) => s + c.valor, 0);
    const costoMensual = costosFijos.filter(c => c.tipo === "mensual").reduce((s, c) => s + c.valor, 0);
    const costoTotalPeriodo = costoUnico + (costoMensual * mesesProyeccion);
    const margenPorPrenda = precioVenta - costoPorPrenda;
    const breakEvenUnidades = Math.ceil(costoTotalPeriodo / margenPorPrenda);
    const breakEvenIngresos = breakEvenUnidades * precioVenta;

    const escenarios = ESCENARIOS.map(e => {
      const unidades = Math.round(unidadesDrop * e.pct);
      const ingresos = unidades * precioVenta;
      const costo = costoUnico + (costoPorPrenda * unidades) + (costoMensual * mesesProyeccion);
      const ganancia = ingresos - costo;
      const roi = costo > 0 ? ((ganancia / costo) * 100) : 0;
      return { ...e, unidades, ingresos, costo, ganancia, roi };
    });

    // Curva ingreso vs costo para gráfica break-even
    const curva = [];
    const maxU = unidadesDrop + 20;
    for (let u = 0; u <= maxU; u += Math.ceil(maxU / 20)) {
      curva.push({
        unidades: u,
        ingresos: u * precioVenta,
        costos: costoUnico + (costoPorPrenda * u) + (costoMensual * mesesProyeccion),
      });
    }

    // Proyección mensual de flujo de caja (distribuye ventas uniformemente)
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const mesActual = new Date().getMonth();
    const flujoMensual = ESCENARIOS.map(e => {
      const unidadesMes = Math.round((unidadesDrop * e.pct) / mesesProyeccion);
      return {
        id: e.id, label: e.label,
        meses: Array.from({ length: mesesProyeccion }, (_, i) => ({
          mes: meses[(mesActual + i) % 12],
          ingresos: unidadesMes * precioVenta,
          gastos: costoMensual + (i === 0 ? costoUnico : 0),
          neto: (unidadesMes * precioVenta) - costoMensual - (i === 0 ? costoUnico : 0),
        })),
      };
    });

    // Datos históricos reales de Supabase
    const ingresosReales = (ventas || []).reduce((s, v) => s + Number(v.monto || 0), 0);
    const gastosReales = (gastos || []).reduce((s, g) => s + Number(g.cantidad || 0), 0);
    const ventasDrop1 = (ventas || []).length;

    return {
      costoUnico, costoMensual, costoTotalPeriodo, margenPorPrenda,
      breakEvenUnidades, breakEvenIngresos, escenarios, curva, flujoMensual,
      ingresosReales, gastosReales, ventasDrop1,
    };
  }, [costosFijos, costoPorPrenda, precioVenta, unidadesDrop, mesesProyeccion, ventas, gastos]);

  return (
    <div>
      {/* Datos reales del Drop 001 */}
      <div style={{ ...stCard, marginBottom: 20, borderLeft: "4px solid #FFF200" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📊 Drop 001 — Resultados reales (base para proyectar)</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Ventas registradas", val: calculos.ventasDrop1, unit: "unidades" },
            { label: "Ingresos reales", val: fmt(calculos.ingresosReales), unit: "" },
            { label: "Gastos registrados", val: fmt(calculos.gastosReales), unit: "" },
            { label: "Margen real", val: fmt(calculos.ingresosReales - calculos.gastosReales), unit: "" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{s.val} <span style={{ fontSize: 12, color: G1 }}>{s.unit}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        {/* Panel de parámetros */}
        <div style={{ ...stCard, flex: "1 1 300px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>⚙️ Parámetros del Drop 002</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Costo por prenda ($)", val: costoPorPrenda, set: setCostoPorPrenda },
              { label: "Precio de venta ($)", val: precioVenta, set: setPrecioVenta },
              { label: "Unidades del drop", val: unidadesDrop, set: setUnidadesDrop },
              { label: "Período proyección (meses)", val: mesesProyeccion, set: setMesesProyeccion },
            ].map(p => (
              <div key={p.label}>
                <label style={stLabel}>{p.label}</label>
                <input type="number" style={stInput} value={p.val}
                  onChange={e => p.set(Number(e.target.value) || 0)} />
              </div>
            ))}
          </div>

          <div style={{ background: "#f9f9f6", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Margen por prenda</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1a7a1a" }}>{fmt(calculos.margenPorPrenda)}</div>
            <div style={{ fontSize: 11, color: G1 }}>{precioVenta > 0 ? Math.round((calculos.margenPorPrenda / precioVenta) * 100) : 0}% del precio de venta</div>
          </div>

          <div style={{ borderRadius: 8, padding: "10px 14px", background: "#e8f5e8", border: "1px solid #c8e8c8" }}>
            <div style={{ fontSize: 11, color: "#1a5c1a", textTransform: "uppercase", marginBottom: 4 }}>Break-even del período</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1a5c1a" }}>{calculos.breakEvenUnidades} unidades</div>
            <div style={{ fontSize: 12, color: "#1a5c1a" }}>{fmt(calculos.breakEvenIngresos)} en ingresos para cubrir todos los costos</div>
          </div>
        </div>

        {/* Panel de costos */}
        <div style={{ ...stCard, flex: "1 1 300px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>💸 Estructura de costos</div>
            <button style={stBtnSm} onClick={() => setShowAddCosto(true)}>+ Agregar</button>
          </div>

          {showAddCosto && (
            <div style={{ background: "#f9f9f6", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <input style={{ ...stInput, marginBottom: 8 }} placeholder="Nombre del costo" value={nuevoCostoLabel} onChange={e => setNuevoCostoLabel(e.target.value)} />
              <input type="number" style={{ ...stInput, marginBottom: 8 }} placeholder="Monto ($)" value={nuevoCostoValor} onChange={e => setNuevoCostoValor(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={stBtnPrimary} onClick={addCosto}>Guardar</button>
                <button style={stBtnSm} onClick={() => setShowAddCosto(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
            {costosFijos.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0f0ec" }}>
                <span style={{ fontSize: 14 }}>{c.icono}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: G2 }}>{c.tipo === "unico" ? "Pago único" : `×${mesesProyeccion} meses`}</div>
                </div>
                {editandoCosto === c.id ? (
                  <input type="number" style={{ ...stInput, width: 80, padding: "4px 8px" }} defaultValue={c.valor}
                    onBlur={e => { updateCosto(c.id, e.target.value); setEditandoCosto(null); }}
                    onKeyDown={e => e.key === "Enter" && e.target.blur()} autoFocus />
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#4D96FF", minWidth: 56, textAlign: "right" }}
                    onClick={() => setEditandoCosto(c.id)}>{fmt(c.valor)}</span>
                )}
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ccc", padding: "0 2px" }}
                  onClick={() => deleteCosto(c.id)}>✕</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "2px solid #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G1, marginBottom: 4 }}>
              <span>Costos únicos</span><strong>{fmt(calculos.costoUnico)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G1, marginBottom: 4 }}>
              <span>Costos mensuales × {mesesProyeccion}</span><strong>{fmt(calculos.costoMensual * mesesProyeccion)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginTop: 6 }}>
              <span>Total período</span><span style={{ color: "#b30000" }}>{fmt(calculos.costoTotalPeriodo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Escenarios */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        {calculos.escenarios.map(e => (
          <div key={e.id} style={{ ...stCard, borderTop: `4px solid ${COLORES[e.id]}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORES[e.id], textTransform: "uppercase", marginBottom: 10 }}>{e.label}</div>
            <div style={{ fontSize: 11, color: G2, marginBottom: 12 }}>{e.desc} · {e.unidades} unidades</div>
            {[
              { label: "Ingresos", val: fmt(e.ingresos), color: "#1a7a1a" },
              { label: "Costos totales", val: fmt(e.costo), color: "#b30000" },
              { label: "Ganancia neta", val: fmt(e.ganancia), color: e.ganancia >= 0 ? "#1a7a1a" : "#b30000" },
              { label: "ROI", val: `${e.roi.toFixed(1)}%`, color: e.roi >= 0 ? "#1a7a1a" : "#b30000" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: G1 }}>{r.label}</span>
                <strong style={{ color: r.color }}>{r.val}</strong>
              </div>
            ))}
            <div style={{ marginTop: 10, height: 4, background: "#eee", borderRadius: 4 }}>
              <div style={{ height: 4, width: `${Math.min(100, Math.max(0, e.roi))}%`, background: COLORES[e.id], borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica break-even */}
      <div style={{ ...stCard, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Punto de equilibrio — Ingresos vs Costos totales</div>
        <div style={{ fontSize: 12, color: G1, marginBottom: 14 }}>La línea verde cruza a la roja en la unidad {calculos.breakEvenUnidades} — ahí empiezas a ganar dinero.</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={calculos.curva} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="unidades" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Unidades vendidas", position: "insideBottom", offset: -2, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1).toFixed(0)}`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => fmt(v)} />
            <ReferenceLine x={calculos.breakEvenUnidades} stroke="#FFF200" strokeWidth={2} strokeDasharray="6 3" label={{ value: `Break-even: ${calculos.breakEvenUnidades}u`, position: "top", fontSize: 11, fill: "#000" }} />
            <Line type="monotone" dataKey="ingresos" stroke="#6BCB77" strokeWidth={2.5} dot={false} name="Ingresos" />
            <Line type="monotone" dataKey="costos" stroke="#FF6B6B" strokeWidth={2.5} dot={false} name="Costos totales" />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Flujo de caja mensual */}
      <div style={stCard}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Flujo de caja proyectado por mes</div>
        <div style={{ fontSize: 12, color: G1, marginBottom: 14 }}>Escenario esperado — distribución uniforme de ventas en {mesesProyeccion} meses.</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={calculos.flujoMensual.find(f => f.id === "esperado")?.meses || []}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => fmt(v)} />
            <Bar dataKey="ingresos" fill="#6BCB77" radius={[4, 4, 0, 0]} name="Ingresos" />
            <Bar dataKey="gastos" fill="#FF6B6B" radius={[4, 4, 0, 0]} name="Gastos" />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {calculos.flujoMensual.find(f => f.id === "esperado")?.meses.map((m, i) => (
            <div key={i} style={{ background: m.neto >= 0 ? "#e8f5e8" : "#fde8e8", borderRadius: 8, padding: "8px 14px", minWidth: 100 }}>
              <div style={{ fontSize: 11, color: G2 }}>{m.mes}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: m.neto >= 0 ? "#1a7a1a" : "#b30000" }}>{fmt(m.neto)}</div>
              <div style={{ fontSize: 10, color: G1 }}>neto</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const stCard = { background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e5e0" };
const stLabel = { fontSize: 11, fontWeight: 600, color: G2, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, display: "block" };
const stInput = { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" };
const stBtnPrimary = { padding: "8px 16px", borderRadius: 6, border: "2px solid #FFF200", background: "#FFF200", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const stBtnSm = { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 12, cursor: "pointer" };
