import { supabase } from "./supabaseClient";

function mapGastoFromDb(g) {
  return {
    id: g.id,
    fecha: g.fecha,
    proveedor: g.proveedor,
    concepto: g.concepto,
    cantidad: Number(g.cantidad),
    pago: g.pago,
    notas: g.notas || "",
    factura: g.factura_url || null,
  };
}

export async function getGastos() {
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data.map(mapGastoFromDb);
}

export async function subirFactura(file) {
  if (!file) return null;
  const nombreArchivo = `factura_${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("comprobantes")
    .upload(nombreArchivo, file);
  if (error) throw error;
  const { data } = supabase.storage
    .from("comprobantes")
    .getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

export async function crearGasto(form, facturaUrl) {
  const { data, error } = await supabase
    .from("gastos")
    .insert({
      fecha: form.fecha,
      proveedor: form.proveedor,
      concepto: form.concepto,
      cantidad: Number(form.cantidad),
      pago: form.pago,
      notas: form.notas,
      factura_url: facturaUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return mapGastoFromDb(data);
}

export async function actualizarGasto(id, form, facturaUrl) {
  const updateData = {
    fecha: form.fecha,
    proveedor: form.proveedor,
    concepto: form.concepto,
    cantidad: Number(form.cantidad),
    pago: form.pago,
    notas: form.notas,
  };
  if (facturaUrl) updateData.factura_url = facturaUrl;

  const { data, error } = await supabase
    .from("gastos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapGastoFromDb(data);
}

export async function borrarGasto(id) {
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw error;
}
