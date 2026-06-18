export const Y = "#FFF200";
export const B = "#000000";
export const G1 = "#6E6E6E";
export const G2 = "#969696";
export const CR = "#F3F3EF";

export const MODELOS = [
  { id: "cosmopolitan", nombre: "Cosmopolitan", prefix: "MC" },
  { id: "espressomartini", nombre: "Espresso Martini", prefix: "ME" },
  { id: "cubalibre", nombre: "Cuba Libre", prefix: "MCL" },
  { id: "negroni", nombre: "Negroni", prefix: "MN" },
  { id: "moscowmule", nombre: "Moscow Mule", prefix: "MM" },
];

export const TALLAS = ["XS", "S", "M", "L", "XL"];
export const PLATAFORMAS = ["Instagram", "WhatsApp", "Evento", "Cash", "Otro"];
export const PAGOS = [
  "Zelle", "Venmo", "Cash", "Transferencia", "Zinli", "USDT",
  "USDC", "Kontigo", "Binance", "PayPal", "Otro",
];
export const VENDEDORAS = ["Cori", "Adri", "Otra"];
export const REFERIDOS = ["Sin referido", "Juan Cristóbal", "Cori", "Adri", "Otro"];
export const DELIVERY = ["Local", "Nacional", "Internacional"];
export const DELIVERY_PROVIDERS = ["Ridery", "Yummy", "MRW", "Zoom", "Tealca", "Otro"];
export const GASTO_PAGOS = [
  "Zelle", "Venmo", "Cash", "Transferencia", "Zinli", "USDT",
  "USDC", "Kontigo", "Binance", "PayPal", "Tarjeta", "Otro",
];
export const GASTO_CONCEPTOS = [
  "Materia prima", "Producción", "Envíos", "Marketing",
  "Empaque", "Software", "Comisiones", "Servicios", "Otro",
];
export const ACCEPT = "image/*,.jpg,.jpeg,.png,.doc,.docx,.pdf";
export const PAGE_SIZES = [12, 20, 50, 100, "Todos"];

export const EDAD_BRACKETS = ["18-24", "25-34", "35-44", "45-54", "55+", "Sin dato"];
export function edadBracket(edad) {
  const n = Number(edad);
  if (!edad || isNaN(n) || n <= 0) return "Sin dato";
  if (n < 25) return "18-24";
  if (n < 35) return "25-34";
  if (n < 45) return "35-44";
  if (n < 55) return "45-54";
  return "55+";
}

export const RIDERY_ESTADOS = ["Pendiente", "Conductor asignado", "En camino", "Entregado", "Incidencia"];
export const RIDERY_ESTADO_COLOR = {
  Pendiente: { bg: "#f0f0ec", text: "#6E6E6E" },
  "Conductor asignado": { bg: "#fff8d6", text: "#8a6d00" },
  "En camino": { bg: "#e8eefc", text: "#1a4a9e" },
  Entregado: { bg: "#e8f5e8", text: "#1a7a1a" },
  Incidencia: { bg: "#fde8e8", text: "#b30000" },
};

export function emptyVentaForm() {
  return {
    codigo: "", comprador: "", telefono: "", correo: "", ciudad: "", edad: "",
    vendedora: "Cori", fecha: new Date().toISOString().slice(0, 10),
    plataforma: "Instagram", pago: "Zelle", monto: 30, items: 1,
    referencia: "", referido: "Sin referido", delivery: "Local",
    proveedorDelivery: "", trackingId: "", costoDelivery: 0, notas: "",
  };
}

export function emptyGastoForm() {
  return {
    fecha: new Date().toISOString().slice(0, 10), proveedor: "",
    concepto: "Materia prima", cantidad: "", pago: "Zelle", notas: "",
  };
}

export function emptyInvForm() {
  return {
    codigo: "", modelo: "cosmopolitan", talla: "S", drop: "DROP 001",
    precio_costo: 12.65, precio_venta: 30,
  };
}
