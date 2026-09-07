import { readApiResponse } from "@/lib/api-response";

export type MediaFolder = "profile" | "projects" | "case-studies" | "experiments" | "blogs" | "dashboards" | "achievements" | "resume" | "cv" | "supporting";

async function databaseFallback(file: File, endpoint: "/api/media" | "/api/document-upload") {
  const form = new FormData(); form.append("file", file);
  const payload = await readApiResponse<{ url?: string }>(await fetch(endpoint, { method: "POST", body: form }));
  return payload.url ?? null;
}

export async function uploadPortfolioMedia(file: File, folder: MediaFolder, fallbackEndpoint: "/api/media" | "/api/document-upload") {
  const start = await readApiResponse<{ mode: "drive"; uploadUrl: string; folder: MediaFolder } | { mode: "database" }>(await fetch("/api/admin/google-drive/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", size: file.size, folder }) }));
  if (start.mode === "database") return databaseFallback(file, fallbackEndpoint);
  const upload = await fetch(start.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream", "Content-Range": `bytes 0-${file.size - 1}/${file.size}` }, body: file });
  if (!upload.ok) throw new Error("Google Drive could not receive this upload. Please try again.");
  const driveFile = await upload.json() as { id?: string };
  if (!driveFile.id) throw new Error("Google Drive did not return the uploaded file.");
  const completed = await readApiResponse<{ url?: string }>(await fetch("/api/admin/google-drive/uploads/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ externalId: driveFile.id, folder: start.folder, size: file.size }) }));
  return completed.url ?? null;
}
