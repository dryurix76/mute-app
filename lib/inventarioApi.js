import { supabase } from "./supabaseClient";

export async function getInventario() {
  const { data, error } = await supabase
    .from("inventario")
    .select("*")
    .order("codigo", { ascending: true });
  if (error) throw error;
  return data.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    modelo: i.modelo,
    nombre: i.nombre,
    talla: i.talla,
    drop: i.drop_nombre,
    precio_costo: Number(i.precio_costo),
    precio_venta: Number(i.precio_venta),
  }));
}

export async function crearPrendaInventario(item) {
  const { data, error } = await supabase
    .from("inventario")
    .insert({
      codigo: item.codigo,
      modelo: item.modelo,
      nombre: item.nombre,
      talla: item.talla,
      drop_nombre: item.drop || "DROP 001",
      precio_costo: item.precio_costo,
      precio_venta: item.precio_venta,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarPrendaInventario(id, item) {
  const { data, error } = await supabase
    .from("inventario")
    .update({
      codigo: item.codigo,
      modelo: item.modelo,
      nombre: item.nombre,
      talla: item.talla,
      drop_nombre: item.drop,
      precio_costo: item.precio_costo,
      precio_venta: item.precio_venta,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function borrarPrendaInventario(id) {
  const { error } = await supabase.from("inventario").delete().eq("id", id);
  if (error) throw error;
}

// Actualiza un solo campo de una prenda sin tocar los demás
export async function actualizarCampoInventario(id, campo, valor) {
  const { data, error } = await supabase
    .from("inventario")
    .update({ [campo]: valor })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
