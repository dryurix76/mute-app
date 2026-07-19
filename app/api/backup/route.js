import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const [
      { data: inventario },
      { data: ventas },
      { data: gastos },
      { data: delivery_orders },
    ] = await Promise.all([
      sb.from("inventario").select("*").order("id"),
      sb.from("ventas").select("*").order("id"),
      sb.from("gastos").select("*").order("id"),
      sb.from("delivery_orders").select("*").order("id").then(r => r).catch(() => ({ data: [] })),
    ]);

    const backup = {
      version: "1.0",
      fecha: new Date().toISOString(),
      marca: "MUTE",
      tablas: {
        inventario: inventario || [],
        ventas: ventas || [],
        gastos: gastos || [],
        delivery_orders: delivery_orders || [],
      },
      totales: {
        inventario: (inventario||[]).length,
        ventas: (ventas||[]).length,
        gastos: (gastos||[]).length,
      },
    };

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mute_backup_${new Date().toISOString().slice(0,10)}.json"`,
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
