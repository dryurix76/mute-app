"use client";
import { useState } from "react";
import { G1, G2 } from "../../lib/constants";
import { updatePassword, actualizarPerfil } from "../../lib/authApi";

export default function TabPerfil({
  st, currentUser, perfiles, userEmail,
  currency, setCurrency, exchangeRate, setExchangeRate,
  bcvFecha, bcvLoading, bcvError, onRefreshBcv, onRefreshPerfiles,
}) {
  const propio = perfiles.find((p) => p.nombre === currentUser) || {};
  const [telefono, setTelefono] = useState(propio.telefono || "");
  const [sheetUrl, setSheetUrl] = useState(propio.sheet_url || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [pwConfirmar, setPwConfirmar] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  async function handleGuardarPerfil() {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await actualizarPerfil(currentUser, { telefono, sheet_url: sheetUrl });
      await onRefreshPerfiles();
      setProfileMsg("Datos guardados ✓");
    } catch (e) {
      setProfileMsg("Error: " + e.message);
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(""), 3000);
    }
  }

  async function handleCambiarPassword() {
    setPwMsg("");
    if (pwNueva.length < 6) { setPwMsg("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    if (pwNueva !== pwConfirmar) { setPwMsg("Las contraseñas no coinciden."); return; }
    setPwSaving(true);
    try {
      await updatePassword(pwNueva);
      setPwMsg("Contraseña actualizada ✓");
      setPwActual(""); setPwNueva(""); setPwConfirmar("");
    } catch (e) {
      setPwMsg("Error: " + e.message);
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(""), 3000);
    }
  }

  return (
    <div>
      <div style={st.grid2}>
        <div style={st.card}>
          <div style={st.sTitle}>Mi perfil — {currentUser}</div>
          <div style={{ marginBottom: 14 }}>
            <label style={st.fLabel}>Correo (login)</label>
            <div style={{ ...st.inp, background: "#f5f5f0", color: G1 }}>{userEmail}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={st.fLabel}>Teléfono</label>
            <input style={st.inp} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="0414-000-0000" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={st.fLabel}>Google Sheet / Excel conectado</label>
            <input style={st.inp} value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={st.btn(true)} onClick={handleGuardarPerfil} disabled={savingProfile}>{savingProfile ? "Guardando..." : "Guardar Datos"}</button>
            {profileMsg && <span style={{ fontSize: 12, color: profileMsg.includes("Error") ? "#b30000" : "#1a7a1a", fontWeight: 600 }}>{profileMsg}</span>}
          </div>
        </div>

        <div style={st.card}>
          <div style={st.sTitle}>Cambiar Contraseña</div>
          <div style={{ marginBottom: 14 }}>
            <label style={st.fLabel}>Nueva contraseña</label>
            <input type="password" style={st.inp} value={pwNueva} onChange={(e) => setPwNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={st.fLabel}>Confirmar nueva contraseña</label>
            <input type="password" style={st.inp} value={pwConfirmar} onChange={(e) => setPwConfirmar(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={st.btn(true)} onClick={handleCambiarPassword} disabled={pwSaving}>{pwSaving ? "Actualizando..." : "Actualizar Contraseña"}</button>
            {pwMsg && <span style={{ fontSize: 12, color: pwMsg.includes("Error") || pwMsg.includes("no coinciden") || pwMsg.includes("al menos") ? "#b30000" : "#1a7a1a", fontWeight: 600 }}>{pwMsg}</span>}
          </div>
        </div>
      </div>

      <div style={st.card}>
        <div style={st.sTitle}>Moneda y Tasa BCV</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
          <button style={st.btn(currency === "USD")} onClick={() => setCurrency("USD")}>USD ($)</button>
          <button style={st.btn(currency === "BS")} onClick={() => setCurrency("BS")}>Bolívares (Bs)</button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={st.fLabel}>Tasa de cambio (Bs por $1)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" style={{ ...st.inp, width: 150 }} value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value) || 0)} />
            <button style={st.btnSm()} onClick={onRefreshBcv} disabled={bcvLoading}>{bcvLoading ? "Actualizando..." : "🏦 Actualizar desde BCV"}</button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: bcvError ? "#b30000" : G2 }}>
          {bcvError ? "No se pudo obtener la tasa BCV automáticamente. Puedes ingresarla a mano." : bcvFecha ? `Tasa oficial BCV publicada el ${bcvFecha}.` : "Tasa BCV no cargada aún."}
        </div>
      </div>
    </div>
  );
}
