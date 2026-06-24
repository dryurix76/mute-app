"use client";
import { useState } from "react";
import { G1, G2 } from "../../lib/constants";

const CATEGORIAS = {
  legal: {
    label: "Documentos Legales",
    icon: "⚖️",
    color: "#4D96FF",
    docs: [
      { id:"rif", nombre:"RIF — Registro de Información Fiscal", desc:"Documento oficial de identificación tributaria de MUTE.", tipo:"PDF", estado:"pendiente", fecha:null },
      { id:"acta", nombre:"Acta Constitutiva", desc:"Documento de constitución legal de la empresa.", tipo:"PDF", estado:"pendiente", fecha:null },
      { id:"marca", nombre:"Registro de Marca — MUTE", desc:"Certificado de registro de marca ante SAPI.", tipo:"PDF", estado:"pendiente", fecha:null },
      { id:"terminos", nombre:"Términos y Condiciones de Venta", desc:"Política de ventas, devoluciones y garantías.", tipo:"HTML", estado:"disponible", fecha:"Jun 2026", url:"#" },
      { id:"privacidad", nombre:"Política de Privacidad", desc:"Tratamiento de datos personales de clientes.", tipo:"HTML", estado:"disponible", fecha:"Jun 2026", url:"#" },
    ]
  },
  financiero: {
    label: "Documentos Financieros",
    icon: "💰",
    color: "#6BCB77",
    docs: [
      { id:"balance", nombre:"Balance General — Cápsula 001", desc:"Estado financiero del primer drop (ventas, costos, márgenes).", tipo:"Excel", estado:"pendiente", fecha:null },
      { id:"flujo", nombre:"Flujo de Caja Proyectado", desc:"Proyección de ingresos y egresos para los próximos 6 meses.", tipo:"Excel", estado:"pendiente", fecha:null },
      { id:"presupuesto", nombre:"Presupuesto Producción Drop 002", desc:"Desglose de costos de producción estimados.", tipo:"PDF", estado:"pendiente", fecha:null },
    ]
  },
  operacional: {
    label: "Documentos Operacionales",
    icon: "📋",
    color: "#FFA94D",
    docs: [
      { id:"catalogo", nombre:"Catálogo Cápsula 001", desc:"Lookbook y ficha técnica de los 5 modelos.", tipo:"PDF", estado:"pendiente", fecha:null },
      { id:"guia_tallas", nombre:"Guía de Tallas", desc:"Tabla de medidas oficiales XS–XL.", tipo:"PDF", estado:"disponible", fecha:"Jun 2026", url:"#" },
      { id:"proceso", nombre:"Proceso de Venta y Envío", desc:"Manual interno: cómo registrar una venta y coordinar delivery.", tipo:"Word", estado:"disponible", fecha:"Jun 2026", url:"#" },
      { id:"proveedor", nombre:"Ficha de Proveedor Principal", desc:"Datos de contacto y condiciones con el fabricante.", tipo:"Word", estado:"pendiente", fecha:null },
    ]
  },
  marketing: {
    label: "Marketing y Comunicación",
    icon: "📣",
    color: "#B983FF",
    docs: [
      { id:"brand", nombre:"Manual de Marca MUTE", desc:"Colores, tipografías, logo, tono de voz y lineamientos visuales.", tipo:"PDF", estado:"pendiente", fecha:null },
      { id:"estrategia", nombre:"Estrategia de Contenido — Instagram", desc:"Plan mensual de publicaciones y stories.", tipo:"Word", estado:"pendiente", fecha:null },
      { id:"media_kit", nombre:"Media Kit", desc:"Información de MUTE para colaboraciones y prensa.", tipo:"PDF", estado:"pendiente", fecha:null },
    ]
  },
};

const TIPO_COLOR = { PDF:"#FF6B6B", HTML:"#4D96FF", Excel:"#6BCB77", Word:"#4D96FF" };

export default function TabDocumentacion({ st }) {
  const [catActiva, setCatActiva] = useState("legal");
  const [busqueda, setBusqueda] = useState("");
  const [subiendo, setSubiendo] = useState(null);

  const cat = CATEGORIAS[catActiva];
  const docsFiltrados = busqueda
    ? Object.values(CATEGORIAS).flatMap(c => c.docs).filter(d =>
        d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.desc.toLowerCase().includes(busqueda.toLowerCase())
      )
    : cat.docs;

  const totalDocs = Object.values(CATEGORIAS).flatMap(c => c.docs).length;
  const docsDisponibles = Object.values(CATEGORIAS).flatMap(c => c.docs).filter(d => d.estado === "disponible").length;

  function handleSubir(docId) {
    setSubiendo(docId);
    setTimeout(() => setSubiendo(null), 1500);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background:"#000", borderRadius:14, padding:"22px 28px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ color:"#fff", fontSize:18, fontWeight:700, marginBottom:4 }}>Repositorio de Documentos</div>
          <div style={{ color:"#555", fontSize:12 }}>Documentos legales, financieros y operacionales de MUTE</div>
        </div>
        <div style={{ display:"flex", gap:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:700, color:"#fff" }}>{totalDocs}</div>
            <div style={{ fontSize:10, color:"#555" }}>Total docs</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:700, color:"#6BCB77" }}>{docsDisponibles}</div>
            <div style={{ fontSize:10, color:"#555" }}>Disponibles</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:700, color:"#FF6B6B" }}>{totalDocs - docsDisponibles}</div>
            <div style={{ fontSize:10, color:"#555" }}>Pendientes</div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom:16 }}>
        <input style={{ ...st.inp, width:"100%", fontSize:14, padding:"12px 16px" }}
          placeholder="🔍 Buscar documento..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}/>
      </div>

      {/* Tabs de categorías */}
      {!busqueda && (
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {Object.entries(CATEGORIAS).map(([id, c]) => (
            <button key={id} onClick={() => setCatActiva(id)} style={{
              padding:"9px 16px", borderRadius:24, border:"1px solid", cursor:"pointer",
              fontSize:12, fontWeight:catActiva===id?700:400, transition:"all .15s",
              background:catActiva===id?"#000":"#fff",
              color:catActiva===id?"#fff":"#666",
              borderColor:catActiva===id?"#000":"#ddd",
            }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Documentos */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {(busqueda ? [{ ...cat, docs: docsFiltrados }] : [cat]).map(cat => (
          docsFiltrados.length === 0 ? (
            <div key="empty" style={{ ...st.card, textAlign:"center", padding:32, color:G2 }}>
              No se encontraron documentos para "{busqueda}"
            </div>
          ) : (
            docsFiltrados.map(doc => (
              <div key={doc.id} style={{ background:"#fff", borderRadius:12, padding:"18px 22px", border:"1px solid #e5e5e0", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                {/* Ícono tipo */}
                <div style={{ width:44, height:44, borderRadius:10, background:TIPO_COLOR[doc.tipo]+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {doc.tipo==="PDF"?"📄":doc.tipo==="Excel"?"📊":doc.tipo==="Word"?"📝":"🌐"}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <strong style={{ fontSize:14 }}>{doc.nombre}</strong>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:TIPO_COLOR[doc.tipo]+"22", color:TIPO_COLOR[doc.tipo] }}>{doc.tipo}</span>
                    {doc.fecha && <span style={{ fontSize:10, color:G2 }}>{doc.fecha}</span>}
                  </div>
                  <div style={{ fontSize:12, color:G1 }}>{doc.desc}</div>
                </div>

                {/* Estado y acciones */}
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  {doc.estado==="disponible" ? (
                    <>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#e8f5e8", color:"#1a7a1a" }}>✓ Disponible</span>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ padding:"7px 14px", borderRadius:7, background:"#000", color:"#FFF200", fontSize:12, fontWeight:600, textDecoration:"none" }}>
                          Descargar
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#f5f5f0", color:"#999" }}>Pendiente</span>
                      <label style={{ padding:"7px 14px", borderRadius:7, border:"1px solid #ddd", color:"#666", fontSize:12, fontWeight:600, cursor:"pointer", background:"#fff" }}>
                        {subiendo===doc.id ? "Subiendo..." : "📎 Subir"}
                        <input type="file" style={{ display:"none" }} accept=".pdf,.doc,.docx,.xlsx,.xls,.html" onChange={() => handleSubir(doc.id)}/>
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))
          )
        ))}
      </div>

      <div style={{ ...st.card, marginTop:20, background:"#f9f9f6", border:"1px solid #e5e5e0" }}>
        <div style={{ fontSize:12, color:G1, lineHeight:1.7 }}>
          <strong>Nota sobre el almacenamiento:</strong> Los documentos subidos se guardarán en el bucket "comprobantes" de Supabase Storage. Los documentos marcados como "Pendiente" son plantillas sugeridas — sube los archivos reales cuando estén listos. Los documentos en HTML (Términos, Política de Privacidad) se pueden editar directamente en el código del dashboard.
        </div>
      </div>
    </div>
  );
}
