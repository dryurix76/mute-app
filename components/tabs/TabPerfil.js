"use client";
import { G1, G2 } from "../../lib/constants";

export default function TabPerfil({ st, currentUser, setCurrentUser, currency, setCurrency, exchangeRate, setExchangeRate }) {
  return (
    <div>
      <div style={{ ...st.card, marginBottom: 16, padding: "14px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Nota sobre el login</div>
        <div style={{ fontSize: 12, color: G1 }}>
          Esta versión usa un selector simple de usuario activo (Cori / Adri) sin contraseña real.
          Para login con contraseña de verdad, el siguiente paso es activar Supabase Auth — puedo
          configurarlo cuando quieras, crea cuentas reales con email y contraseña para cada una.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["Cori", "Adri"].map((u) => (
          <button key={u} style={st.btn(currentUser === u)} onClick={() => setCurrentUser(u)}>{u}</button>
        ))}
      </div>

      <div style={st.card}>
        <div style={st.sTitle}>Moneda</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <button style={st.btn(currency === "USD")} onClick={() => setCurrency("USD")}>USD ($)</button>
          <button style={st.btn(currency === "BS")} onClick={() => setCurrency("BS")}>Bolívares (Bs)</button>
        </div>
        <div>
          <label style={st.fLabel}>Tasa de cambio (Bs por $1)</label>
          <input type="number" style={{ ...st.inp, width: 150 }} value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value) || 0)} />
        </div>
      </div>
    </div>
  );
}
