import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { driveAuthorizationUrl } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminSession(session)) return NextResponse.redirect(new URL("/admin/login", request.url));
  const state = crypto.randomUUID();
  try {
    const response = NextResponse.redirect(driveAuthorizationUrl(state));
    response.cookies.set("portfolio_google_drive_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin?drive=configuration-error", request.url));
  }
}
