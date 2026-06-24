"use client";
import { useState, useRef, useEffect } from "react";

const Y = "#FFF200";
const B = "#000";

const SUGERENCIAS_INTERNO = [
  "¿Qué modelo está vendiendo mejor esta semana?",
  "¿Qué tallas nos están faltando en inventario?",
  "Dame un análisis rápido de ventas del mes",
  "¿Por qué plataforma están comprando más?",
  "¿Qué ideas tienes para el próximo drop?",
  "Investiga competencia de franelas premium en Venezuela",
];

const SUGERENCIAS_VENDEDOR = [
  "¿Cuál modelo me recomiendas si me gustan los cócteles?",
  "¿Qué tallas tienen disponibles?",
  "¿Cómo hago un pedido?",
  "Cuéntame sobre el Espresso Martini",
  "¿Cuál es la más popular?",
];

const MENSAJE_BIENVENIDA_INTERNO = `¡Hola! Soy **Claudio**, tu asistente interno de MUTE 🖤

Tengo acceso en tiempo real a tus datos de ventas, inventario y gastos. Puedo ayudarte a:
- 📊 Analizar qué está funcionando y qué no
- 📦 Identificar problemas de stock antes de que ocurran
- 💡 Proponer ideas para el próximo drop
- 🔍 Investigar la competencia en internet

¿Por dónde empezamos?`;

const MENSAJE_BIENVENIDA_VENDEDOR = `¡Hola! Soy **Claudio**, el asistente de ventas de MUTE 🍸

Soy el bot que hablaría con tus clientes. Conozco todos los modelos de memoria y puedo ayudarlos a elegir su franela perfecta.

Este es un preview de cómo respondería. ¿Qué le quieres preguntar?`;

export default function ClaudioChat() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("interno");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const bienvenida = mode === "interno" ? MENSAJE_BIENVENIDA_INTERNO : MENSAJE_BIENVENIDA_VENDEDOR;
  const sugerencias = mode === "interno" ? SUGERENCIAS_INTERNO : SUGERENCIAS_VENDEDOR;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function changeMode(newMode) {
    setMode(newMode);
    setMessages([]);
    setError(null);
  }

  async function sendMessage(text) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    setError(null);

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/claudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, mode }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function renderText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: open ? "#333" : B, border: `2px solid ${Y}`,
          cursor: "pointer", fontSize: 22, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
        title="Claudio — Asistente MUTE"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Panel del chat */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 999,
          width: "min(420px, calc(100vw - 48px))",
          height: "min(600px, calc(100vh - 120px))",
          background: "#fff", borderRadius: 16,
          border: "1px solid #e5e5e0", boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{ background: B, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: Y, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Claudio</div>
                <div style={{ color: "#888", fontSize: 11 }}>Asistente MUTE · {loading ? "escribiendo..." : "en línea"}</div>
              </div>
            </div>
            {/* Selector de modo */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "interno", label: "🏪 Interno", desc: "Datos + Estrategia" },
                { id: "vendedor", label: "🛍️ Vendedor", desc: "Preview cliente" },
              ].map((m) => (
                <button key={m.id} onClick={() => changeMode(m.id)} style={{
                  flex: 1, padding: "6px 10px", borderRadius: 8, cursor: "pointer", border: "none",
                  background: mode === m.id ? Y : "#1a1a1a",
                  color: mode === m.id ? B : "#888",
                  fontWeight: mode === m.id ? 700 : 400, fontSize: 11,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Bienvenida */}
            <div style={{ background: "#f5f5f0", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}
              dangerouslySetInnerHTML={{ __html: renderText(bienvenida) }}/>

            {/* Sugerencias (solo si no hay mensajes) */}
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sugerencias.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)} style={{
                    textAlign: "left", padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid #e5e5e0", background: "#fff",
                    fontSize: 12, color: "#333", fontFamily: "'DM Sans',sans-serif",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => e.target.style.background = "#f9f9f6"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Historial */}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                  background: m.role === "user" ? B : "#f5f5f0",
                  color: m.role === "user" ? "#fff" : "#000",
                  fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif",
                }}
                  dangerouslySetInnerHTML={{ __html: renderText(m.content) }}
                />
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#f5f5f0", borderRadius: "4px 12px 12px 12px", width: "fit-content" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#999", animation: `bounce 1.2s ${i * 0.2}s infinite` }}/>
                ))}
              </div>
            )}

            {error && (
              <div style={{ background: "#fde8e8", color: "#8a0000", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
                Error: {error}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 24, border: "1px solid #ddd",
                fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif",
              }}
              placeholder={mode === "interno" ? "Pregunta sobre tus datos..." : "Simula una pregunta de cliente..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: "50%", border: "none",
                background: input.trim() && !loading ? B : "#e0e0e0",
                color: input.trim() && !loading ? Y : "#aaa",
                cursor: input.trim() && !loading ? "pointer" : "default",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
