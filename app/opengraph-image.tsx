import { ImageResponse } from "next/og";
import { getSiteProfile } from "@/lib/content";
import { publicProfileCopy, publicProfileSummary } from "@/lib/public-copy";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const profile = await getSiteProfile();

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
        <div style={{ display: "flex", justifyContent: "space-between", color: "#bccbb2", fontSize: 24, letterSpacing: 4, textTransform: "uppercase" }}>
          <span>{profile.role}</span>
          <span>{profile.ogTopLabel}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700 }}>{profile.name}</div>
          <div style={{ maxWidth: 880, color: "#aeb9aa", fontSize: 30, lineHeight: 1.35 }}>{publicProfileCopy(profile.seoDescription, publicProfileSummary)}</div>
        </div>
        <div style={{ display: "flex", gap: 18, color: "#79b8a7", fontSize: 24 }}>
          <span>{profile.ogCenterLabel}</span><span>/</span><span>{publicProfileCopy(profile.ogFooterLabel, "Recruiter-ready navigation")}</span>
        </div>
      </div>
    ),
    size
  );
}
