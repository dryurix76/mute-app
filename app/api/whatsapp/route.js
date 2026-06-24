// ============================================================
// MUTE — WhatsApp Business API (Meta Cloud API directa)
// Maneja: envío de mensajes, notificaciones de stock bajo,
// recibo de ventas, y webhook de mensajes entrantes.
// ============================================================
import { createClient } from "@supabase/supabase-js";

const META_API = "https://graph.facebook.com/v19.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mute_webhook_2026";

// ── Utilidades ──────────────────────────────────────────────

function limpiarTelefono(tel) {
  // Convierte "+58 414-123-4567" → "584141234567"
  return tel?.toString().replace(/\D/g, "").replace(/^0/, "58") || null;
}

async function sendMessage(to, body) {
  const tel = limpiarTelefono(to);
  if (!tel) throw new Error("Teléfono inválido: " + to);
  const res = await fetch(`${META_API}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "text",
      text: { body },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Error Meta API");
  return data;
}

async function sendTemplate(to, templateName, components = []) {
  const tel = limpiarTelefono(to);
  if (!tel) throw new Error("Teléfono inválido");
  const res = await fetch(`${META_API}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "template",
      template: { name: templateName, language: { code: "es" }, components },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Error Meta API template");
  return data;
}

// ── POST: Enviar mensaje o notificación ─────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const { tipo, telefono, datos } = body;

    // Verificar credenciales
    if (!PHONE_ID || !TOKEN) {
      return Response.json({
        ok: false,
        error: "Faltan variables de entorno: WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN",
      }, { status: 500 });
    }

    // ── 1. Recibo de venta ───────────────────────────────────
    if (tipo === "recibo") {
      const { comprador, telefono: tel, modelo, talla, codigo, monto, pago, vendedora, fecha } = datos;
      const msg = [
        `✅ *¡Gracias por tu compra en MUTE!*`,
        ``,
        `🧾 *Resumen de tu pedido*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👕 Modelo: *${modelo}*`,
        `📏 Talla: *${talla || "—"}*`,
        `🔖 Código: \`${codigo}\``,
        `💰 Total: *$${Number(monto).toFixed(2)}*`,
        `💳 Pago: ${pago}`,
        `📅 Fecha: ${fecha || new Date().toLocaleDateString("es-VE")}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `Con amor, el equipo MUTE 🖤`,
        `@mutethebrand`,
      ].join("\n");
      await sendMessage(tel || telefono, msg);
      return Response.json({ ok: true, tipo: "recibo_enviado" });
    }

    // ── 2. Notificación de stock bajo ────────────────────────
    if (tipo === "stock_bajo") {
      const { alertas, telefonos } = datos;
      const msg = [
        `⚠️ *MUTE — Alerta de Stock Bajo*`,
        ``,
        `Las siguientes combinaciones tienen ≤2 unidades disponibles:`,
        ``,
        ...alertas.map(a => `• ${a.nombre} talla ${a.talla}: *${a.cantidad} restante${a.cantidad !== 1 ? "s" : ""}*`),
        ``,
        `📋 Revisa el inventario en el dashboard.`,
      ].join("\n");
      const resultados = await Promise.allSettled(
        (telefonos || []).map(tel => sendMessage(tel, msg))
      );
      const exitosos = resultados.filter(r => r.status === "fulfilled").length;
      return Response.json({ ok: true, tipo: "stock_notificado", exitosos, total: telefonos?.length });
    }

    // ── 3. Confirmación de orden (carrito web) ───────────────
    if (tipo === "orden_confirmada") {
      const { comprador, telefono: tel, items, total, formaPago } = datos;
      const itemsList = items.map(i => `  • ${i.modelo} talla ${i.talla} — $${i.precio}`).join("\n");
      const msg = [
        `🛍️ *Nueva orden confirmada — MUTE*`,
        ``,
        `*Cliente:* ${comprador}`,
        `*Pedido:*`,
        itemsList,
        ``,
        `*Total: $${Number(total).toFixed(2)}*`,
        `*Forma de pago:* ${formaPago}`,
        ``,
        `Cori o Adri se pondrán en contacto para coordinar el envío. 🚀`,
      ].join("\n");
      await sendMessage(tel, msg);
      return Response.json({ ok: true, tipo: "orden_confirmada_enviada" });
    }

    // ── 4. Mensaje personalizado libre ───────────────────────
    if (tipo === "mensaje_libre") {
      const { mensaje } = datos;
      await sendMessage(telefono, mensaje);
      return Response.json({ ok: true, tipo: "mensaje_enviado" });
    }

    return Response.json({ ok: false, error: "Tipo de mensaje no reconocido: " + tipo }, { status: 400 });

  } catch (e) {
    console.error("WhatsApp API error:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// ── GET: Verificación del webhook de Meta ───────────────────

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook de WhatsApp verificado correctamente ✓");
    return new Response(challenge, { status: 200 });
  }
  return new Response("Token de verificación incorrecto", { status: 403 });
}
