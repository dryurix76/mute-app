"use client";
import { useState } from "react";
import { G1, G2 } from "../../lib/constants";
import { updatePassword, updateEmail, actualizarPerfil } from "../../lib/authApi";

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

  const [pwNueva, setPwNueva] = useState("");
  const [pwConfirmar, setPwConfirmar] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [correoMsg, setCorreoMsg] = useState("");
  const [correoSaving, setCorreoSaving] = useState(false);

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
      setPwNueva(""); setPwConfirmar("");
    } catch (e) {
      setPwMsg("Error: " + e.message);
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(""), 4000);
    }
  }

  async function handleCambiarCorreo() {
    setCorreoMsg("");
    if (!nuevoCorreo || !nuevoCorreo.includes("@")) { setCorreoMsg("Ingresa un correo válido."); return; }
    setCorreoSaving(true);
    try {
      await updateEmail(nuevoCorreo);
      setCorreoMsg("✓ Se enviaron links de confirmación al correo actual y al nuevo. El cambio aplica al confirmar ambos.");
      setNuevoCorreo("");
    } catch (e) {
      setCorreoMsg("Error: " + e.message);
    } finally {
      setCorreoSaving(false);
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

      <div style={{ ...st.card, marginBottom: 20 }}>
        <div style={st.sTitle}>Cambiar Correo</div>
        <div style={{ fontSize: 12, color: "#6E6E6E", marginBottom: 14 }}>
          Correo actual: <strong>{userEmail}</strong>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={st.fLabel}>Nuevo correo</label>
          <input type="email" style={st.inp} value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} placeholder="nuevo@correo.com" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={st.btn(true)} onClick={handleCambiarCorreo} disabled={correoSaving}>
            {correoSaving ? "Enviando..." : "Cambiar Correo"}
          </button>
        </div>
        {correoMsg && (
          <div style={{ fontSize: 12, color: correoMsg.includes("Error") ? "#b30000" : "#1a7a1a", fontWeight: 600, marginTop: 10, lineHeight: 1.5 }}>{correoMsg}</div>
        )}
        <div style={{ fontSize: 11, color: "#6E6E6E", marginTop: 10 }}>
          Supabase enviará un link de confirmación tanto al correo actual como al nuevo. El cambio solo se aplica cuando se confirman ambos.
        </div>
      </div>


      <div style={{ ...st.card, background:"#f9f9f6", padding:"14px 20px" }}>
        <div style={{ fontSize:12, color:"#6E6E6E" }}>
          💡 El selector de moneda (USD / Bs) y la tasa de cambio BCV están disponibles en la barra superior del dashboard.
        </div>
      </div>
    </div>
  );
}
