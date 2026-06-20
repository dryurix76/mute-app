// Tasa oficial del Banco Central de Venezuela (BCV), vía el CDN público de DolarVZLA.
// Endpoint sin API key, CORS abierto, pensado para llamarse directo desde el navegador.
// Documentación: https://www.dolarvzla.com/dev
const BCV_ENDPOINT = "https://rates.dolarvzla.com/bcv/current.json";

export async function getTasaBCV() {
  const res = await fetch(BCV_ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener la tasa BCV");
  const data = await res.json();
  // Forma esperada: { current: { usd, eur, date }, previous: {...}, changePercentage: {...} }
  return {
    usd: data.current?.usd ?? null,
    eur: data.current?.eur ?? null,
    fecha: data.current?.date ?? null,
    variacionUsd: data.changePercentage?.usd ?? null,
  };
}
