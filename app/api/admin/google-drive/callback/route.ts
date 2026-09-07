import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { exchangeDriveCode, saveDriveConnection } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const base = new URL("/admin", request.url);
  if (!session?.user?.id || !isAdminSession(session)) return NextResponse.redirect(new URL("/admin/login", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("portfolio_google_drive_state")?.value) {
    base.searchParams.set("drive", "connection-cancelled");
    return NextResponse.redirect(base);
  }
  try {
    await saveDriveConnection(await exchangeDriveCode(code));
    base.searchParams.set("drive", "connected");
  } catch {
    base.searchParams.set("drive", "connection-error");
  }
  const response = NextResponse.redirect(base);
  response.cookies.delete("portfolio_google_drive_state");
  return response;
}
