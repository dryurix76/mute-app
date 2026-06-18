import { supabase } from "./supabaseClient";

function mapVentaFromDb(v) {
  return {
    id: v.id,
    codigo: v.codigo,
    modelo: v.modelo,
    comprador: v.comprador,
    telefono: v.telefono || "",
    correo: v.correo || "",
    ciudad: v.ciudad || "",
    edad: v.edad || "",
    vendedora: v.vendedora,
    fecha: v.fecha,
    plataforma: v.plataforma,
    pago: v.pago,
    monto: Number(v.monto),
    items: v.items || 1,
    referencia: v.referencia || "",
    referido: v.referido || "Sin referido",
    delivery: v.delivery || "Local",
    proveedorDelivery: v.proveedor_delivery || "",
    trackingId: v.tracking_id || "",
    costoDelivery: Number(v.costo_delivery || 0),
    comprobante: v.comprobante_url || null,
    notas: v.notas || "",
  };
}

export async function getVentas() {
  const { data, error } = await supabase
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data.map(mapVentaFromDb);
}

export async function subirComprobante(file) {
  if (!file) return null;
  const nombreArchivo = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("comprobantes")
    .upload(nombreArchivo, file);
  if (error) throw error;
  const { data } = supabase.storage
    .from("comprobantes")
    .getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

export async function crearVenta(form, comprobanteUrl) {
  const { data, error } = await supabase
    .from("ventas")
    .insert({
      codigo: form.codigo,
      modelo: form.modelo,
      comprador: form.comprador,
      telefono: form.telefono,
      correo: form.correo,
      ciudad: form.ciudad,
      edad: form.edad,
      vendedora: form.vendedora,
      fecha: form.fecha,
      plataforma: form.plataforma,
      pago: form.pago,
      monto: Number(form.monto),
      items: Number(form.items) || 1,
      referencia: form.referencia,
      referido: form.referido,
      delivery: form.delivery,
      proveedor_delivery: form.proveedorDelivery,
      tracking_id: form.trackingId,
      costo_delivery: Number(form.costoDelivery) || 0,
      comprobante_url: comprobanteUrl,
      notas: form.notas,
    })
    .select()
    .single();
  if (error) throw error;
  return mapVentaFromDb(data);
}

export async function actualizarVenta(id, form, comprobanteUrl) {
  const updateData = {
    codigo: form.codigo,
    comprador: form.comprador,
    telefono: form.telefono,
    correo: form.correo,
    ciudad: form.ciudad,
    edad: form.edad,
    vendedora: form.vendedora,
    fecha: form.fecha,
    plataforma: form.plataforma,
    pago: form.pago,
    monto: Number(form.monto),
    items: Number(form.items) || 1,
    referencia: form.referencia,
    referido: form.referido,
    delivery: form.delivery,
    proveedor_delivery: form.proveedorDelivery,
    tracking_id: form.trackingId,
    costo_delivery: Number(form.costoDelivery) || 0,
    notas: form.notas,
  };
  if (comprobanteUrl) updateData.comprobante_url = comprobanteUrl;

  const { data, error } = await supabase
    .from("ventas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapVentaFromDb(data);
}

export async function borrarVenta(id) {
  const { error } = await supabase.from("ventas").delete().eq("id", id);
  if (error) throw error;
}
