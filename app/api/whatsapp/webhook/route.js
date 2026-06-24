// ============================================================
// MUTE — Webhook de mensajes ENTRANTES de WhatsApp
// Meta llama a este endpoint cada vez que un cliente escribe.
// ============================================================
import { createClient } from "@supabase/supabase-js";

const META_API = "https://graph.facebook.com/v19.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mute_webhook_2026";

async function responder(to, texto) {
  await fetch(`${META_API}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: texto },
    }),
  });
}

function respuestaClaudio(texto) {
  const t = texto.toLowerCase();
  if (t.includes("precio") || t.includes("costo") || t.includes("cuanto")) {
    return `💰 Todas nuestras franelas tienen un precio de *$30*.\n\nTenemos 5 modelos disponibles:\n• 🍸 Cosmopolitan\n• ☕ Espresso Martini\n• 🥤 Cuba Libre\n• 🍊 Negroni\n• 🫚 Moscow Mule\n\n¿Cuál te llama la atención?`;
  }
  if (t.includes("talla") || t.includes("size") || t.includes("medida")) {
    return `📏 Tenemos disponibles las tallas *XS, S, M, L y XL*.\n\nSi me dices tu talla habitual o tus medidas (pecho en cm), te ayudo a elegir la correcta. 😊`;
  }
  if (t.includes("modelo") || t.includes("diseño") || t.includes("cual") || t.includes("cuál")) {
    return `🍹 Nuestros 5 modelos Cápsula 001:\n\n• *Cosmopolitan* — elegante, rosa vibrante\n• *Espresso Martini* — oscuro, sofisticado\n• *Cuba Libre* — fresco, verde y tropical\n• *Negroni* — clásico italiano, naranja y rojo\n• *Moscow Mule* — cobre y menta, muy fresquito\n\nTodos a $30. ¿Cuál es el tuyo?`;
  }
  if (t.includes("pago") || t.includes("pagar") || t.includes("zelle") || t.includes("binance") || t.includes("paypal")) {
    return `💳 Aceptamos:\n• Zelle\n• Binance Pay (USDT/USDC)\n• PayPal\n• Zinli\n• Pago Móvil\n\nEscríbenos al Instagram @mutethebrand para coordinar tu pago. 🖤`;
  }
  if (t.includes("envio") || t.includes("envío") || t.includes("delivery") || t.includes("llega")) {
    return `🛵 Hacemos delivery en Caracas a través de Ridery.\n\nEl costo de envío es de *$5* y te llega el mismo día si haces tu pedido antes de las 3pm.\n\n¿A qué zona de Caracas sería?`;
  }
  if (t.includes("hola") || t.includes("buenas") || t.includes("buen dia") || t.includes("buenas tardes")) {
    return `¡Hola! 👋 Bienvenido/a a *MUTE* 🖤\n\nSomos una marca venezolana de franelas premium inspiradas en cócteles clásicos.\n\n¿En qué te puedo ayudar?\n• Ver modelos y precios\n• Consultar tallas\n• Hacer un pedido\n• Coordinar envío`;
  }
  return `Hola, soy Claudio, el asistente de *MUTE* 🖤\n\nPuedo ayudarte con:\n• 👕 Modelos disponibles\n• 📏 Tallas y medidas\n• 💰 Precios\n• 💳 Formas de pago\n• 🛵 Delivery en Caracas\n\n¿Qué necesitas?`;
}

// GET: Verificación del webhook
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// POST: Recibir mensajes entrantes
export async function POST(req) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return Response.json({ ok: true, msg: "No hay mensajes nuevos" });
    }

    for (const msg of messages) {
      const from = msg.from; // número del cliente
      const tipo = msg.type;

      if (tipo === "text") {
        const texto = msg.text?.body || "";
        console.log(`Mensaje de ${from}: ${texto}`);
        const respuesta = respuestaClaudio(texto);
        await responder(from, respuesta);

        // Guardar mensaje en Supabase para que aparezca en el dashboard
        try {
          const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );
          await sb.from("whatsapp_mensajes").insert({
            telefono: from,
            mensaje: texto,
            respuesta,
            created_at: new Date().toISOString(),
          }).then(() => {}); // fire and forget
        } catch (e) {
          console.log("No se pudo guardar mensaje (tabla puede no existir aún):", e.message);
        }
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
