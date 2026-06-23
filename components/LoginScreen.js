"use client";
import { useState } from "react";
import { signIn, resetPassword } from "../lib/authApi";

const inp = { width:"100%", padding:"10px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:14, boxSizing:"border-box", outline:"none" };
const lbl = { fontSize:11, fontWeight:600, color:"#6E6E6E", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4, display:"block" };

export default function LoginScreen() {
  const [mode, setMode] = useState("login"); // "login" | "recover"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text:"", type:"" });
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg({ text:"", type:"" });
    setLoading(true);
    try {
      await signIn(email, password);
      // onAuthChange en page.js detecta el cambio de sesión automáticamente
    } catch {
      setMsg({ text:"Correo o contraseña incorrectos.", type:"error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e) {
    e.preventDefault();
    setMsg({ text:"", type:"" });
    if (!email || !email.includes("@")) {
      setMsg({ text:"Ingresa tu correo antes de continuar.", type:"error" });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setMsg({ text:"✓ Te enviamos un link para restablecer tu contraseña. Revisa tu correo (incluyendo la carpeta de spam).", type:"ok" });
    } catch (err) {
      setMsg({ text:"No se pudo enviar el correo: " + err.message, type:"error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F3F3EF", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"36px 32px", width:360, maxWidth:"100%", border:"1px solid #e5e5e0", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>

        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:28, fontWeight:700 }}>mute.</div>
          <div style={{ fontSize:12, color:"#6E6E6E", marginTop:4 }}>
            {mode==="login" ? "Inventario y Ventas — Cápsula 001" : "Recuperar contraseña"}
          </div>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <label style={lbl}>Correo</label>
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
              style={{ ...inp, marginBottom:16 }} placeholder="cori@mutethebrand.com"/>

            <label style={lbl}>Contraseña</label>
            <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)}
              style={{ ...inp, marginBottom:8 }}/>

            <div style={{ textAlign:"right", marginBottom:20 }}>
              <button type="button" onClick={()=>{ setMode("recover"); setMsg({ text:"",type:"" }); }}
                style={{ background:"none", border:"none", fontSize:12, color:"#6600CC", cursor:"pointer", padding:0 }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {msg.text && (
              <div style={{ fontSize:12, color:msg.type==="error"?"#b30000":"#1a7a1a", marginBottom:14, lineHeight:1.5 }}>{msg.text}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"12px", borderRadius:6, border:"2px solid #FFF200", background:"#FFF200", fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        {mode === "recover" && (
          <form onSubmit={handleRecover}>
            <div style={{ fontSize:13, color:"#6E6E6E", marginBottom:20, lineHeight:1.6 }}>
              Ingresa tu correo y te enviaremos un link para restablecer tu contraseña.
            </div>

            <label style={lbl}>Correo</label>
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
              style={{ ...inp, marginBottom:20 }} placeholder="cori@mutethebrand.com"/>

            {msg.text && (
              <div style={{ fontSize:12, color:msg.type==="error"?"#b30000":"#1a7a1a", marginBottom:14, lineHeight:1.6, padding:"10px 12px", background:msg.type==="error"?"#fde8e8":"#e8f5e8", borderRadius:8 }}>{msg.text}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"12px", borderRadius:6, border:"2px solid #FFF200", background:"#FFF200", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:12 }}>
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>

            <button type="button" onClick={()=>{ setMode("login"); setMsg({ text:"",type:"" }); }}
              style={{ width:"100%", padding:"10px", borderRadius:6, border:"1px solid #ddd", background:"#fff", fontSize:13, color:"#6E6E6E", cursor:"pointer" }}>
              ← Volver al login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
