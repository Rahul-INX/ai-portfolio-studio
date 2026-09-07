import { decryptApiKey, encryptApiKey } from "@/lib/ai-key-crypto";
import { prisma } from "@/lib/prisma";
import { safeFileName } from "@/lib/stored-files";

export const driveFolders = ["profile", "projects", "case-studies", "experiments", "blogs", "dashboards", "achievements", "resume", "cv", "supporting"] as const;
export type DriveFolder = (typeof driveFolders)[number];

type DriveFile = { id: string; name: string; mimeType: string; size?: string; parents?: string[]; trashed?: boolean; emailAddress?: string };
type DriveConnection = { encryptedValue: string; iv: string; authTag: string; rootFolderId: string; folderIds: unknown };

const folderPlan: Record<DriveFolder, string[]> = {
  profile: ["images", "profile"], projects: ["images", "projects"], "case-studies": ["images", "case-studies"], experiments: ["images", "experiments"], blogs: ["images", "blogs"], dashboards: ["images", "dashboards"], achievements: ["images", "achievements"], resume: ["documents", "resume"], cv: ["documents", "cv"], supporting: ["documents", "supporting"],
};

export function googleDriveConfigured() {
  return Boolean(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REDIRECT_URI);
}

export function driveAuthorizationUrl(state: string) {
  if (!googleDriveConfigured()) throw new Error("Google Drive OAuth is not configured on this environment.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!, redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI!, response_type: "code", scope: "https://www.googleapis.com/auth/drive.file", access_type: "offline", prompt: "consent", state }).toString();
  return url.toString();
}

async function tokenRequest(params: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  if (!response.ok) throw new Error("Google could not authorize this Drive connection.");
  return response.json() as Promise<{ access_token?: string; refresh_token?: string }>;
}

export async function exchangeDriveCode(code: string) {
  if (!googleDriveConfigured()) throw new Error("Google Drive OAuth is not configured on this environment.");
  const tokens = await tokenRequest(new URLSearchParams({ code, client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!, client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!, redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI!, grant_type: "authorization_code" }));
  if (!tokens.access_token || !tokens.refresh_token) throw new Error("Google did not return a reusable Drive connection. Remove this app from Google and connect again.");
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
}

async function accessToken(connection: DriveConnection) {
  if (!googleDriveConfigured()) throw new Error("Google Drive OAuth is not configured on this environment.");
  const refreshToken = decryptApiKey(connection);
  const tokens = await tokenRequest(new URLSearchParams({ client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!, client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!, refresh_token: refreshToken, grant_type: "refresh_token" }));
  if (!tokens.access_token) throw new Error("Google Drive connection expired. Reconnect Drive in the CMS.");
  return tokens.access_token;
}

async function driveJson<T>(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error("Google Drive could not complete this request.");
  return response.json() as Promise<T>;
}

async function createFolder(name: string, parentId: string | undefined, token: string) {
  return driveJson<DriveFile>("https://www.googleapis.com/drive/v3/files?fields=id,name", token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}), appProperties: { portfolioStudioManaged: "true" } }) });
}

export async function createDriveLibrary(accessTokenValue: string) {
  const root = await createFolder("Portfolio Studio Media", undefined, accessTokenValue);
  const folders: Record<string, string> = {};
  const branches: Record<string, string> = {};
  for (const [folder, path] of Object.entries(folderPlan)) {
    let parent = root.id;
    let breadcrumb = "";
    for (const part of path) {
      breadcrumb = breadcrumb ? `${breadcrumb}/${part}` : part;
      if (!branches[breadcrumb]) branches[breadcrumb] = (await createFolder(part, parent, accessTokenValue)).id;
      parent = branches[breadcrumb];
    }
    folders[folder] = parent;
  }
  return { rootFolderId: root.id, folderIds: folders };
}

function folderId(connection: DriveConnection, folder: DriveFolder) {
  const folders = connection.folderIds as Record<string, unknown>;
  const id = folders?.[folder];
  if (typeof id !== "string") throw new Error("The connected Drive library is incomplete. Reconnect Google Drive.");
  return id;
}

export async function saveDriveConnection(input: { refreshToken: string; accessToken: string }) {
  const existing = await getDriveConnection();
  let library: { rootFolderId: string; folderIds: Record<string, string> };
  if (existing) {
    try {
      await driveJson<DriveFile>(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(existing.rootFolderId)}?fields=id,name`, input.accessToken);
      library = { rootFolderId: existing.rootFolderId, folderIds: existing.folderIds as Record<string, string> };
    } catch {
      library = await createDriveLibrary(input.accessToken);
    }
  } else {
    library = await createDriveLibrary(input.accessToken);
  }
  const profile = await driveJson<{ user?: { emailAddress?: string } }>("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)", input.accessToken);
  const encrypted = encryptApiKey(input.refreshToken);
  return prisma.driveConnection.upsert({ where: { id: "main" }, update: { ...encrypted, rootFolderId: library.rootFolderId, folderIds: library.folderIds, accountEmail: profile.user?.emailAddress ?? null, lastVerifiedAt: new Date() }, create: { id: "main", ...encrypted, rootFolderId: library.rootFolderId, folderIds: library.folderIds, accountEmail: profile.user?.emailAddress ?? null, lastVerifiedAt: new Date() } });
}

export async function getDriveConnection() {
  return prisma.driveConnection.findUnique({ where: { id: "main" } });
}

export async function verifyDriveConnection() {
  const connection = await getDriveConnection();
  if (!connection) throw new Error("Connect Google Drive before using Drive storage.");
  const token = await accessToken(connection);
  await driveJson<DriveFile>(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(connection.rootFolderId)}?fields=id,name`, token);
  await prisma.driveConnection.update({ where: { id: "main" }, data: { lastVerifiedAt: new Date() } });
  return connection;
}

export async function initiateDriveUpload(input: { fileName: string; contentType: string; size: number; folder: DriveFolder; origin?: string }) {
  const connection = await getDriveConnection();
  if (!connection) return null;
  const token = await accessToken(connection);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,parents", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": input.contentType, "X-Upload-Content-Length": String(input.size), ...(input.origin ? { Origin: input.origin } : {}) }, body: JSON.stringify({ name: safeFileName(input.fileName, "portfolio-media"), mimeType: input.contentType, parents: [folderId(connection, input.folder)], appProperties: { portfolioStudioManaged: "true", folder: input.folder } }) });
  const uploadUrl = response.headers.get("location");
  if (!response.ok || !uploadUrl) throw new Error("Google Drive could not start this upload.");
  return { uploadUrl, folder: input.folder };
}

export async function finalizeDriveUpload(input: { externalId: string; folder: DriveFolder; expectedSize?: number }) {
  const connection = await getDriveConnection();
  if (!connection) throw new Error("Google Drive is not connected.");
  const token = await accessToken(connection);
  const file = await driveJson<DriveFile>(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.externalId)}?fields=id,name,mimeType,size,parents,trashed`, token);
  if (file.trashed || !file.parents?.includes(folderId(connection, input.folder))) throw new Error("The uploaded file is not in this portfolio Drive library.");
  if (input.expectedSize !== undefined && Number(file.size ?? -1) !== input.expectedSize) throw new Error("Google Drive did not retain the complete uploaded file.");
  const asset = await prisma.mediaAsset.upsert({ where: { externalId: file.id }, update: { fileName: safeFileName(file.name, "portfolio-media"), contentType: file.mimeType, size: Number(file.size ?? 0), folder: input.folder, trashedAt: null }, create: { externalId: file.id, fileName: safeFileName(file.name, "portfolio-media"), contentType: file.mimeType, size: Number(file.size ?? 0), folder: input.folder } });
  return { asset, url: `/api/media/${encodeURIComponent(asset.id)}` };
}

export async function uploadBufferToDrive(input: { fileName: string; contentType: string; data: Buffer; folder: DriveFolder }) {
  const connection = await getDriveConnection();
  if (!connection) throw new Error("Google Drive is not connected.");
  const token = await accessToken(connection);
  const boundary = `portfolio-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name: safeFileName(input.fileName, "portfolio-media"), mimeType: input.contentType, parents: [folderId(connection, input.folder)], appProperties: { portfolioStudioManaged: "true", folder: input.folder } });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${input.contentType}\r\n\r\n`), input.data, Buffer.from(`\r\n--${boundary}--`)]);
  const file = await driveJson<DriveFile>("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,parents", token, { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body });
  return finalizeDriveUpload({ externalId: file.id, folder: input.folder, expectedSize: input.data.length });
}

export async function downloadDriveAsset(externalId: string) {
  const connection = await getDriveConnection();
  if (!connection) throw new Error("Google Drive is not connected.");
  const token = await accessToken(connection);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(externalId)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok || !response.body) throw new Error("Google Drive media is temporarily unavailable.");
  return response;
}

export async function findByteIdenticalDriveAsset<T extends { id: string; externalId: string }>(
  source: Buffer,
  candidates: T[],
  read = async (externalId: string) => Buffer.from(await (await downloadDriveAsset(externalId)).arrayBuffer()),
) {
  for (const candidate of candidates) {
    if (source.equals(await read(candidate.externalId))) return candidate;
  }
  return null;
}

export async function trashDriveAsset(externalId: string) {
  const connection = await getDriveConnection();
  if (!connection) throw new Error("Google Drive is not connected.");
  const token = await accessToken(connection);
  await driveJson<DriveFile>(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(externalId)}?fields=id`, token, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trashed: true }) });
}
