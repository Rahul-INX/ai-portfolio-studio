export const MAX_DATABASE_FILE_SIZE = 4 * 1024 * 1024;
export const MULTIPART_OVERHEAD_ALLOWANCE = 128 * 1024;

export const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function storedFileUrl(id: string) {
  return `/api/files/${encodeURIComponent(id)}`;
}

export function safeFileName(name: string, fallback: string) {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f"\\/]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}

export function requestIsTooLarge(request: Request) {
  const value = request.headers.get("content-length");
  if (!value) return false;
  const contentLength = Number(value);
  return (
    Number.isFinite(contentLength) &&
    contentLength > MAX_DATABASE_FILE_SIZE + MULTIPART_OVERHEAD_ALLOWANCE
  );
}

export function getMimeTypeByExtension(filename: string): string | null {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  return null;
}

