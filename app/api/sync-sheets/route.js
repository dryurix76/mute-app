import { GoogleAuth } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

// Esta ruta corre SOLO en el servidor de Vercel, nunca en el navegador.
// La llave privada de Google jamás se expone al cliente.

const SHEET_ID = "19ly6AcCLr9NbTHGzeY-C5YSMwTJPlcfmviAd_ETYpqs";
const SHEET_GID = "826663950";

// Mapeo de nombre de modelo en el Sheet -> id interno usado en el dashboard
const MODELO_MAP = {
  COSMOPOLITAN: "cosmopolitan",
  "ESPRESSO MARTINI": "espressomartini",
  EXPRESO: "espressomartini",
  "CUBA LIBRE": "cubalibre",
  NEGRONI: "negroni",
  "MOSCOW MULE": "moscowmule",
};

function normalizaModelo(raw) {
  if (!raw) return null;
  const key = raw.toString().trim().toUpperCase();
  return MODELO_MAP[key] || key.toLowerCase().replace(/\s+/g, "");
}

function extraeVendedora(observaciones) {
  if (!observaciones) return "";
  const m = observaciones.match(/vendedor\s*:\s*([a-zA-Záéíóúñ]+)/i);
  if (!m) return "";
  const nombre = m[1].trim().toLowerCase();
  if (nombre === "cori") return "Cori";
  if (nombre === "adri") return "Adri";
  return m[1].trim();
}

function parseMonto(raw) {
  if (!raw) return 0;
  const limpio = raw.toString().replace(/[^0-9.,-]/g, "").replace(",", ".");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

async function leerSheet() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  // Primero obtenemos el nombre real de la pestaña a partir del gid
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token.token}` } }
  );
  const meta = await metaRes.json();
  if (!metaRes.ok) throw new Error(meta.error?.message || "Error leyendo metadata del Sheet");

  const hoja = meta.sheets.find((s) => String(s.properties.sheetId) === SHEET_GID);
  const nombreHoja = hoja ? hoja.properties.title : meta.sheets[0].properties.title;

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(nombreHoja)}`,
    { headers: { Authorization: `Bearer ${token.token}` } }
  );
  const data = await dataRes.json();
  if (!dataRes.ok) throw new Error(data.error?.message || "Error leyendo valores del Sheet");

  return data.values || [];
}

function filasAVentas(rows) {
  if (rows.length < 2) return { inventario: [], ventas: [], debug: { error: "El Sheet tiene menos de 2 filas" } };
  const headers = rows[0].map((h) => h.toString().trim().toUpperCase());
  const idx = (name) => headers.indexOf(name);

  const iCodigo = idx("CODIG");
  const iModelo = idx("MODELO");
  const iTalla = idx("TALLA");
  const iCosto = idx("COSTO UNIT.");
  const iPrecio = idx("PRECIO VENTA");
  const iCliente = idx("CLIENTE");
  const iPago = idx("METODO DE PAGO");
  const iEstadoPago = idx("ESTADO DE PAGO");
  const iTotal = idx("TOTAL VENTA");
  const iObs = idx("OBSERVACIONES");

  const debug = {
    headersEncontrados: headers,
    indices: { iCodigo, iModelo, iTalla, iCosto, iPrecio, iCliente, iPago, iEstadoPago, iTotal, iObs },
    totalFilas: rows.length - 1,
    primeraFilaEjemplo: rows[1] || null,
  };

  const inventario = [];
  const ventas = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[iCodigo]) continue;

    const codigo = row[iCodigo].toString().trim();
    const modelo = normalizaModelo(row[iModelo]);
    const talla = (row[iTalla] || "").toString().trim().toUpperCase();
    const precioCosto = parseMonto(row[iCosto]);
    const precioVenta = parseMonto(row[iPrecio]);
    const cliente = (row[iCliente] || "").toString().trim();

    inventario.push({ codigo, modelo, talla, precio_costo: precioCosto, precio_venta: precioVenta });

    if (cliente) {
      ventas.push({
        codigo,
        modelo,
        comprador: cliente,
        pago: (row[iPago] || "").toString().trim() || "Otro",
        monto: parseMonto(row[iTotal]) || precioVenta,
        vendedora: extraeVendedora(row[iObs]) || "Cori",
        fecha: new Date().toISOString().slice(0, 10),
        items: 1,
        referido: "Sin referido",
        delivery: "Local",
        notas: `Importado de Google Sheets. Estado de pago: ${row[iEstadoPago] || "—"}. ${row[iObs] || ""}`.trim(),
        plataforma: "Otro",
      });
    }
  }

  debug.inventarioContado = inventario.length;
  debug.ventasDetectadas = ventas.length;
  debug.ejemploVenta = ventas[0] || null;

  return { inventario, ventas, debug };
}

async function sincronizar() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const rows = await leerSheet();
  const { inventario, ventas, debug } = filasAVentas(rows);

  // Trae los códigos que ya existen como venta para no duplicar
  const { data: ventasExistentes, error: errVentasExist } = await supabaseAdmin
    .from("ventas")
    .select("codigo");
  if (errVentasExist) throw errVentasExist;
  const codigosYaVendidos = new Set((ventasExistentes || []).map((v) => v.codigo));

  const ventasNuevas = ventas.filter((v) => !codigosYaVendidos.has(v.codigo));

  let ventasInsertadas = 0;
  if (ventasNuevas.length > 0) {
    const { error: errInsert } = await supabaseAdmin.from("ventas").insert(ventasNuevas);
    if (errInsert) throw errInsert;
    ventasInsertadas = ventasNuevas.length;
  }

  // Actualiza precios de inventario si cambiaron en el Sheet (no crea prendas nuevas
  // para evitar duplicar códigos si el Sheet tiene variaciones de formato)
  let inventarioActualizado = 0;
  for (const item of inventario) {
    if (!item.codigo) continue;
    const { error: errUpdate } = await supabaseAdmin
      .from("inventario")
      .update({ precio_costo: item.precio_costo, precio_venta: item.precio_venta })
      .eq("codigo", item.codigo);
    if (!errUpdate) inventarioActualizado += 1;
  }

  return {
    ok: true,
    filasLeidas: rows.length - 1,
    ventasNuevas: ventasInsertadas,
    inventarioRevisado: inventario.length,
    codigosYaVendidosEnBD: codigosYaVendidos.size,
    debug,
  };
}

export async function POST() {
  try {
    const resultado = await sincronizar();
    return Response.json(resultado);
  } catch (e) {
    console.error("Error sincronizando con Google Sheets:", e);
    return Response.json({ ok: false, error: e.message, stack: e.stack }, { status: 500 });
  }
}

// Permite probar visitando la URL directo en el navegador, para depurar
export async function GET() {
  try {
    const resultado = await sincronizar();
    return Response.json(resultado);
  } catch (e) {
    console.error("Error sincronizando con Google Sheets:", e);
    return Response.json({ ok: false, error: e.message, stack: e.stack }, { status: 500 });
  }
}
