import { Y, B, G1, G2, CR } from "./constants";

export function buildStyles({ isMobile, isTablet, sidebarOpen }) {
  const SIDEBAR_W = 220;
  return {
    root: { fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: CR, minHeight: "100vh", color: B, overflowX: "hidden" },
    sidebar: { width: SIDEBAR_W, background: B, minHeight: "100vh", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 200, transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none", transition: "transform .25s ease", boxShadow: isMobile && sidebarOpen ? "0 0 40px rgba(0,0,0,0.4)" : "none" },
    logoBox: { padding: "28px 24px 20px", borderBottom: "1px solid #222" },
    nav: { padding: "16px 0", flex: 1 },
    navItem: (a) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 24px", cursor: "pointer", fontSize: 13, fontWeight: a ? "600" : "400", color: a ? Y : "#aaa", background: a ? "rgba(255,242,0,0.06)" : "transparent", borderLeft: a ? `3px solid ${Y}` : "3px solid transparent" }),
    main: { marginLeft: isMobile ? 0 : SIDEBAR_W },
    topbar: { background: B, padding: isMobile ? "14px 16px" : "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222", position: "sticky", top: 0, zIndex: 50, gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" },
    content: { padding: isMobile ? "16px" : isTablet ? "22px" : "32px" },
    card: { background: "#fff", borderRadius: 12, padding: isMobile ? "14px 16px" : "20px 24px", border: "1px solid #e5e5e0" },
    statCard: { background: "#fff", borderRadius: 12, padding: isMobile ? "14px 16px" : "20px 24px", border: "1px solid #e5e5e0", flex: 1, minWidth: isMobile ? "100%" : 140 },
    statsRow: { display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" },
    sTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
    badge: (sold) => ({ display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: sold ? "#000" : Y, color: sold ? "#fff" : "#000" }),
    btn: (p) => ({ padding: p ? "10px 20px" : "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: p ? `2px solid ${Y}` : "1px solid #ddd", background: p ? Y : "#fff", color: p ? B : G1 }),
    btnSm: (c) => ({ padding: "4px 10px", borderRadius: 4, fontSize: 12, cursor: "pointer", border: "1px solid #ddd", background: c || "#fff", color: B }),
    inp: { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" },
    sel: { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" },
    fGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 },
    fLabel: { fontSize: 11, fontWeight: 600, color: G1, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, display: "block" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" },
    modal: { background: "#fff", borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? 20 : 32, width: isMobile ? "100%" : 620, maxWidth: "100%", maxHeight: isMobile ? "90vh" : "92vh", overflowY: "auto" },
    th: { fontSize: 11, fontWeight: 600, color: G2, textTransform: "uppercase", letterSpacing: "0.07em", padding: "10px 12px", borderBottom: "1px solid #eee", textAlign: "left", whiteSpace: "nowrap" },
    td: { fontSize: 12, padding: "10px 12px", borderBottom: "1px solid #f0f0ec", color: B, verticalAlign: "middle" },
    PC: { background: Y, color: B, display: "inline-block", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "2px 8px" },
    deliveryBadge: (d) => ({ display: "inline-block", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "2px 8px", whiteSpace: "nowrap", background: d === "Local" ? "#e8f5e8" : d === "Nacional" ? "#fff8d6" : "#e8eefc", color: d === "Local" ? "#1a7a1a" : d === "Nacional" ? "#8a6d00" : "#1a4a9e" }),
    grid2: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 },
    grid3: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: 20, marginBottom: 20 },
  };
}
