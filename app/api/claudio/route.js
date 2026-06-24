import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const SYSTEM_INTERNO = `Eres Claudio, el asistente interno de MUTE — una marca de ropa venezolana que vende franelas premium con diseños de cócteles clásicos (Cosmopolitan, Espresso Martini, Cuba Libre, Negroni, Moscow Mule). 

Tu personalidad: analítico, directo, con criterio de negocio y un toque de humor. Hablas en español venezolano natural, no formal. Cuando ves oportunidades o problemas en los datos, los señalas sin rodeos.

Tus responsabilidades:
- Analizar ventas, inventario y gastos con los datos REALES que te pasan
- Identificar qué modelos van mejor, cuáles tienen stock crítico, cuáles se mueven poco
- Hacer observaciones y recomendaciones estratégicas diarias
- Investigar competencia y tendencias cuando te lo pidan
- Proponer ideas concretas de marketing, precios, drops futuros
- Alertar sobre patrones importantes (ej: cierto modelo se vende más en Instagram, cierta talla siempre se agota primero)

Cuando te den datos de ventas/inventario, SIEMPRE comenta algo específico y útil — no respondas genérico.
Si te preguntan sobre competencia o tendencias, busca información actualizada.`;

const SYSTEM_VENDEDOR = `Eres Claudio, el asistente de ventas de MUTE — una marca premium venezolana de franelas con diseños inspirados en cócteles clásicos. Precio: $30.

Tu personalidad: amable, entusiasta con el producto, conoce cada modelo de memoria. Hablas con los clientes de manera cálida y natural, como si fueras parte del equipo de MUTE.

Sabes que:
- Cosmopolitan: diseño elegante, rosa/rojo. El más popular entre chicas.
- Espresso Martini: diseño oscuro, sofisticado. Favorito de los coffee lovers.  
- Cuba Libre: vibrante, verde y café. Perfecta para los que aman el verano.
- Negroni: clásico italiano, naranja y rojo. Para los que tienen buen gusto.
- Moscow Mule: cobre y verde menta. La más fresquita y divertida.

Tallas disponibles: XS, S, M, L, XL. Precio: $30 c/u.
Para hacer un pedido, los clientes pueden escribir al Instagram @mutethebrand.

Ayuda a los clientes a elegir su modelo según su personalidad, ayúdalos con tallas y responde cualquier duda sobre el producto.`;

async function getContextoDatos() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const [{ data: ventas }, { data: inventario }, { data: gastos }] = await Promise.all([
      sb.from("ventas").select("*").order("fecha", { ascending: false }).limit(100),
      sb.from("inventario").select("*"),
      sb.from("gastos").select("*").order("fecha", { ascending: false }).limit(50),
    ]);

    const codigosVendidos = new Set((ventas || []).map((v) => v.codigo));
    const disponibles = (inventario || []).filter((i) => !codigosVendidos.has(i.codigo));
    const totalIngresos = (ventas || []).reduce((s, v) => s + Number(v.monto || 0), 0);
    const totalGastos = (gastos || []).reduce((s, g) => s + Number(g.cantidad || 0), 0);

    const ventasPorModelo = {};
    (ventas || []).forEach((v) => {
      ventasPorModelo[v.modelo] = (ventasPorModelo[v.modelo] || 0) + 1;
    });

    const ventasPorPlataforma = {};
    (ventas || []).forEach((v) => {
      ventasPorPlataforma[v.plataforma] = (ventasPorPlataforma[v.plataforma] || 0) + 1;
    });

    const stockPorModelo = {};
    (disponibles || []).forEach((i) => {
      if (!stockPorModelo[i.modelo]) stockPorModelo[i.modelo] = {};
      stockPorModelo[i.modelo][i.talla] = (stockPorModelo[i.modelo][i.talla] || 0) + 1;
    });

    return `
=== DATOS REALES DE MUTE (actualizado ahora) ===

VENTAS:
- Total ventas: ${(ventas || []).length} unidades
- Ingresos totales: $${totalIngresos.toFixed(2)}
- Gastos totales: $${totalGastos.toFixed(2)}
- Margen bruto: $${(totalIngresos - totalGastos).toFixed(2)}

VENTAS POR MODELO:
${Object.entries(ventasPorModelo).map(([m, c]) => `- ${m}: ${c} vendidas`).join("\n")}

PLATAFORMAS MÁS EFECTIVAS:
${Object.entries(ventasPorPlataforma).sort((a, b) => b[1] - a[1]).map(([p, c]) => `- ${p}: ${c} ventas`).join("\n")}

INVENTARIO DISPONIBLE:
- Total prendas disponibles: ${disponibles.length}
${Object.entries(stockPorModelo).map(([m, tallas]) => `- ${m}: ${Object.entries(tallas).map(([t, n]) => `${t}(${n})`).join(", ")}`).join("\n")}

ÚLTIMAS 5 VENTAS:
${(ventas || []).slice(0, 5).map((v) => `- ${v.comprador} | ${v.modelo} | ${v.plataforma} | $${v.monto} | ${v.fecha}`).join("\n")}
`;
  } catch (e) {
    return `[No se pudieron cargar los datos de Supabase: ${e.message}]`;
  }
}

export async function POST(req) {
  try {
    const { messages, mode = "interno" } = await req.json();

    const systemPrompt = mode === "vendedor" ? SYSTEM_VENDEDOR : SYSTEM_INTERNO;
    let contextoDatos = "";

    if (mode === "interno") {
      contextoDatos = await getContextoDatos();
    }

    const systemFinal = contextoDatos
      ? `${systemPrompt}\n\n${contextoDatos}`
      : systemPrompt;

    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemFinal,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.error?.message || "Error de la API" }, { status: 500 });
    }

    // Extract text from response (may include tool_use blocks)
    const textContent = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return Response.json({ reply: textContent || "No pude generar una respuesta." });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
