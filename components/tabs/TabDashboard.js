import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Y, B, G1, G2, MODELOS, PLATAFORMAS } from "../../lib/constants";

export default function TabDashboard({ st, fmt, inventory, ventas, disponibles, totalIngresos, margen }) {
  const ventasPorModelo = MODELOS.map((m) => ({
    name: m.nombre.split(" ")[0],
    vendidas: ventas.filter((v) => v.modelo === m.id).length,
    disponibles: disponibles.filter((i) => i.modelo === m.id).length,
  }));
  const ventasPorPlataforma = PLATAFORMAS.map((p) => ({
    name: p,
    value: ventas.filter((v) => v.plataforma === p).length,
  })).filter((p) => p.value > 0);

  return (
    <div>
      <div style={st.statsRow}>
        {[
          { label: "Total", val: inventory.length, sub: "prendas" },
          { label: "Vendidas", val: ventas.length, sub: `${fmt(totalIngresos)} ingresos` },
          { label: "Disponibles", val: disponibles.length, sub: `${inventory.length ? Math.round((disponibles.length / inventory.length) * 100) : 0}%` },
          { label: "Margen", val: fmt(margen), sub: "bruto" },
        ].map((s) => (
          <div key={s.label} style={st.statCard}>
            <div style={{ fontSize: 11, color: G2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: G1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={st.card}>
        <div style={st.sTitle}>Catálogo — Cápsula 001</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
          {MODELOS.map((m) => {
            const sold = ventas.filter((v) => v.modelo === m.id).length;
            const avail = inventory.filter((i) => i.modelo === m.id).length - sold;
            return (
              <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e5e0" }}>
                <div style={{ position: "relative", width: "100%", height: 160, background: "#f0f0ec" }}>
                  <Image src={m.img} alt={m.nombre} fill style={{ objectFit: "cover" }} sizes="200px" />
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{m.nombre}</div>
                  <div style={{ fontSize: 11, color: G1, marginTop: 2 }}>{avail} disponibles</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={st.grid2}>
        <div style={st.card}>
          <div style={st.sTitle}>Ventas por modelo</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ventasPorModelo} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="vendidas" fill={Y} radius={[4, 4, 0, 0]} name="Vendidas" />
              <Bar dataKey="disponibles" fill="#e5e5e0" radius={[4, 4, 0, 0]} name="Disponibles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={st.card}>
          <div style={st.sTitle}>Plataformas</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ventasPorPlataforma} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}(${value})`} labelLine={false}>
                {ventasPorPlataforma.map((_, i) => <Cell key={i} fill={[B, G1, G2, "#333", "#555"][i % 5]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={st.card}>
        <div style={st.sTitle}>Últimas ventas</div>
        {ventas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: G2 }}>Aún no hay ventas registradas.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Código", "Modelo", "Comprador", "Vendedora", "Plataforma", "Pago", "Monto"].map((h) => <th key={h} style={st.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ventas.slice(0, 5).map((v) => (
                <tr key={v.id}>
                  <td style={st.td}><code style={{ background: "#f5f5f0", padding: "2px 5px", borderRadius: 3, fontSize: 11 }}>{v.codigo}</code></td>
                  <td style={st.td}>{MODELOS.find((m) => m.id === v.modelo)?.nombre}</td>
                  <td style={st.td}>{v.comprador}</td>
                  <td style={st.td}>{v.vendedora}</td>
                  <td style={st.td}>{v.plataforma}</td>
                  <td style={st.td}>{v.pago}</td>
                  <td style={st.td}><strong>{fmt(v.monto)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
