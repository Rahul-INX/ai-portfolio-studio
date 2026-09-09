import { NextResponse } from "next/server";
import { downloadDriveAsset } from "@/lib/google-drive";
import { decryptJobFitData } from "@/lib/job-fit-data-crypto";
import { getJobFitInquiry } from "@/lib/job-fit-store";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getJobFitInquiry(id, jobFitSessionFrom(request));
  if (!inquiry) return NextResponse.json({ error: "Original JD attachment not found." }, { status: 404 });
  if (inquiry.sourceAsset) {
    try {
      const file = await downloadDriveAsset(inquiry.sourceAsset.externalId);
      return new Response(file.body, { headers: { "Content-Type": inquiry.sourceAsset.contentType, "Content-Length": String(inquiry.sourceAsset.size), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(inquiry.sourceAsset.fileName)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    } catch { return NextResponse.json({ error: "Original JD attachment is temporarily unavailable." }, { status: 503 }); }
  }
  if (!inquiry.sourceEncryptedValue || !inquiry.sourceIv || !inquiry.sourceAuthTag) return NextResponse.json({ error: "Original JD attachment not found." }, { status: 404 });
  try {
    const data = Buffer.from(decryptJobFitData({ encryptedValue: inquiry.sourceEncryptedValue, iv: inquiry.sourceIv, authTag: inquiry.sourceAuthTag }), "base64");
    return new Response(data, { headers: { "Content-Type": inquiry.sourceContentType ?? "application/octet-stream", "Content-Length": String(data.length), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(inquiry.fileName ?? "job-description")}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Original JD attachment is temporarily unavailable." }, { status: 503 }); }
}
