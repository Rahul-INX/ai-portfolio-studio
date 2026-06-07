import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canReadDatabase, markDatabaseUnavailable } from "@/lib/database-availability";

const eventSchema = z.object({
  contentType: z.enum(["PROJECT", "CASE_STUDY", "EXPERIMENT", "BLOG", "DASHBOARD"]),
  slug: z.string().min(1),
  depth: z.number().int().min(0).max(100)
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (canReadDatabase()) {
    try {
      await prisma.readingEvent.create({
        data: {
          ...parsed.data,
          referrer: request.headers.get("referer"),
          userAgent: request.headers.get("user-agent")
        }
      });
    } catch (error) {
      markDatabaseUnavailable(error);
    }
  }
  return NextResponse.json({ ok: true });
}
