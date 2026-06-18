"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Y, B, G1, G2, TALLAS, PAGOS } from "../../lib/constants";

export default function TabEstadisticas({ st, fmt, inventory, ventas, disponibles, margen, totalIngresos }) {
  const ventasPorVendedora = ["Cori", "Adri"].map((v) => ({
    name: v, count: ventas.filter((x) => x.vendedora === v).length,
    ingresos: ventas.filter((x) => x.vendedora === v).reduce((s, x) => s + x.monto, 0),
  }));

  return (
    <div>
      <div style={st.statsRow}>
        {ventasPorVendedora.map((v) => (
          <div key={v.name} style={st.statCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: Y, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{v.name[0]}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{v.name}</div>
            </div>
            <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 4 }}>Unidades vendidas</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{v.count}</div>
            <div style={{ fontSize: 12, color: G1 }}>{fmt(v.ingresos)} en ingresos</div>
          </div>
        ))}
        <div style={st.statCard}>
          <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", marginBottom: 6 }}>Margen bruto</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(margen)}</div>
          <div style={{ fontSize: 12, color: G1 }}>{ventas.length > 0 && totalIngresos ? Math.round((margen / totalIngresos) * 100) : 0}%</div>
        </div>
      </div>

      <div style={st.grid2}>
        <div style={st.card}>
          <div style={st.sTitle}>Disponibilidad por talla</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={TALLAS.map((t) => ({ talla: t, disponible: disponibles.filter((i) => i.talla === t).length, vendida: ventas.filter((v) => inventory.find((i) => i.codigo === v.codigo)?.talla === t).length }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="talla" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="disponible" fill={Y} radius={[4, 4, 0, 0]} name="Disponible" />
              <Bar dataKey="vendida" fill={B} radius={[4, 4, 0, 0]} name="Vendida" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={st.card}>
          <div style={st.sTitle}>Método de pago</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PAGOS.map((p) => ({ name: p, value: ventas.filter((v) => v.pago === p).length })).filter((p) => p.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}(${value})`} labelLine={false}>
                {PAGOS.map((_, i) => <Cell key={i} fill={[B, Y, G1, G2, "#333"][i % 5]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
