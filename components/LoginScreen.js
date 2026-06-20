"use client";
import { useState } from "react";
import { signIn } from "../lib/authApi";

export default function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F3EF", fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", width: 360, maxWidth: "100%", border: "1px solid #e5e5e0" }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>mute.</div>
        <div style={{ fontSize: 12, color: "#6E6E6E", textAlign: "center", marginBottom: 28 }}>Inventario y Ventas — Cápsula 001</div>

        <label style={{ fontSize: 11, fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, display: "block" }}>Correo</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }}
          placeholder="cori@mutethebrand.com"
        />

        <label style={{ fontSize: 11, fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, display: "block" }}>Contraseña</label>
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, marginBottom: 20, boxSizing: "border-box" }}
        />

        {error && <div style={{ fontSize: 12, color: "#b30000", marginBottom: 16 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 6, border: "2px solid #FFF200", background: "#FFF200", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
