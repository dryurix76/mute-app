import { createClient } from "@supabase/supabase-js";

// Requiere la service_role key — nunca expuesta al navegador.
// Solo elimina filas, nunca borra las tablas ni la estructura.

export async function POST(req) {
  try {
    const body = await req.json();

    // Token de seguridad adicional — el cliente debe enviarlo
    if (body.confirmar !== "BORRAR_TODO_MUTE") {
      return Response.json({ ok: false, error: "Token de confirmación incorrecto." }, { status: 403 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Borramos en orden para respetar foreign keys
    const tablas = [
      "delivery_incidencias",
      "delivery_orders",
      "ventas",
      "gastos",
      "inventario",
    ];

    const resultados = {};
    for (const tabla of tablas) {
      // Supabase requiere una condición para DELETE — usamos neq en id
      const { error, count } = await sb
        .from(tabla)
        .delete({ count: "exact" })
        .neq("id", 0);

      if (error) {
        // Si la tabla no existe o tiene otro tipo de id, intentamos con uuid
        const { error: error2, count: count2 } = await sb
          .from(tabla)
          .delete({ count: "exact" })
          .not("id", "is", null);

        resultados[tabla] = error2
          ? { error: error2.message }
          : { borrados: count2 || 0 };
      } else {
        resultados[tabla] = { borrados: count || 0 };
      }
    }

    const errores = Object.entries(resultados)
      .filter(([, v]) => v.error)
      .map(([k, v]) => `${k}: ${v.error}`);

    return Response.json({
      ok: errores.length === 0,
      resultados,
      errores: errores.length > 0 ? errores : undefined,
      mensaje: errores.length === 0
        ? "✓ Todos los datos fueron eliminados correctamente."
        : "Algunos errores ocurrieron — revisa 'errores' para detalles.",
    });

  } catch (e) {
    console.error("Error en reset-data:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
