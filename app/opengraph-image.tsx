import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #090d0b 0%, #121713 54%, #202722 100%)",
          color: "#eef2ea",
          padding: 64,
          fontFamily: "Arial"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#bccbb2",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase"
          }}
        >
          <span>Senior AI Engineer</span>
          <span>RAG · MLOps · Analytics</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700, letterSpacing: 0 }}>
            Rahul Harivansh Fatyal
          </div>
          <div style={{ maxWidth: 820, color: "#aeb9aa", fontSize: 32, lineHeight: 1.35 }}>
            Portfolio and knowledge hub for trustworthy AI systems, retrieval quality, structured extraction, and
            product-grade engineering.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            color: "#6f8fc8",
            fontSize: 24
          }}
        >
          <span>Evidence-first systems</span>
          <span>•</span>
          <span>Quiet enterprise UX</span>
          <span>•</span>
          <span>Database-backed CMS</span>
        </div>
      </div>
    ),
    size
  );
}
