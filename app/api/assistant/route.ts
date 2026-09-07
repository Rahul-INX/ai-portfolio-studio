import { NextResponse } from "next/server";
import { z } from "zod";
import { evidenceBlock, gatherPortfolioContext, sourcesBlock, type ContextGatheringResult } from "@/lib/site-context";
import { getSiteProfile } from "@/lib/content";
import { runTextWithFallback } from "@/lib/ai-providers";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string()
});

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(messageSchema).optional(),
  path: z.string().max(240).optional()
});

const streamHeaders = {
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "Content-Type": "text/plain; charset=utf-8",
  "X-Accel-Buffering": "no"
};

function fallbackAnswer(_message: string, context: ContextGatheringResult, ownerName: string) {
  const documents = context.evidence.filter((item) => item.kind === "document" && item.fileUrl);
  if (documents.length) {
    return [
      "I found the public Resume/CV downloads:",
      "",
      ...documents.map((item) => `- [${item.title}](${item.fileUrl}) - ${item.summary}`),
      "",
      "You can also use the document hub and CV page for section-level context:",
      "- [Resume & CV Downloads](/timeline#resume-downloads)",
      `- [${ownerName} CV - Summary](/cv#summary)`,
      "",
      "Sources",
      sourcesBlock(context.evidence.slice(0, 6))
    ].join("\n");
  }
  const evidence = context.evidence.slice(0, 4);
  return [
    "Here is the strongest portfolio-grounded answer I can give from the available site context:",
    "",
    ...evidence.map((item) => `- ${item.snippet} See [${item.title}${item.section ? ` - ${item.section}` : ""}](${item.url}).`),
    "",
    "Sources",
    sourcesBlock(evidence)
  ].join("\n");
}

function streamText(text: string) {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/);
  return new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(word));
        await new Promise((resolve) => setTimeout(resolve, 12));
      }
      controller.close();
    }
  });
}

function normalizeProviderAnswer(answer: string, context: ContextGatheringResult) {
  const withoutPlaceholderDomains = answer.replace(/https?:\/\/example\.com/g, "");
  const hasSources = /\n\s*Sources\s*:?\s*\n/i.test(withoutPlaceholderDomains);
  if (hasSources) return withoutPlaceholderDomains;
  return `${withoutPlaceholderDomains.trim()}\n\nSources\n${sourcesBlock(context.evidence.slice(0, 6))}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ask a focused portfolio question." }, { status: 400 });
  }

  const context = await gatherPortfolioContext(parsed.data.message, parsed.data.path);
  const profile = await getSiteProfile();
  const contextBlock = evidenceBlock(context.evidence);

  const systemContent = `You are ${profile.name}'s portfolio assistant. Answer only from gathered portfolio evidence. The visible chat is the main agent; background site context gathering has already happened, so do not mention sub-agents or internal retrieval mechanics.

Rules:
- Use current-page evidence first when it is sufficient.
- Cite claims with the exact markdown section links supplied in the evidence.
- Prefer section links over top-level page links.
- Keep citation URLs relative exactly as supplied, such as /project/slug#overview. Never invent a domain.
- End substantial answers with a short "Sources" list.
- Be concise, evidence-first, and do not invent employers, metrics, links, degrees, or private details.
- If evidence is missing, say what is not established and suggest the closest cited page.
- For resume, CV, PDF, or download questions, include the exact Download URL from evidence when present and cite the Resume & CV Downloads section.

Site route map:
${context.routeMap}

Context gathering decision:
Current path: ${context.decision.currentPath}
Current-page only: ${context.decision.usedCurrentPageOnly}
Reason: ${context.decision.reason}
Scopes: ${context.decision.scopes.join(", ")}

Gathered evidence:
${contextBlock}`;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (parsed.data.history) {
    const recentHistory = parsed.data.history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  messages.push({
    role: "user",
    content: `Current browser path: ${context.decision.currentPath}
Question: ${parsed.data.message}`
  });

  try {
    const result = await runTextWithFallback({
      system: systemContent,
      messages,
      temperature: 0.2,
      enforceQuota: true,
    });
    const answer = normalizeProviderAnswer(result.text, context);
    return new Response(streamText(answer), {
      headers: { ...streamHeaders, "X-Assistant-Mode": result.provider.toLowerCase() }
    });
  } catch {
    return new Response(streamText(fallbackAnswer(parsed.data.message, context, profile.name)), {
      headers: { ...streamHeaders, "X-Assistant-Mode": "local-fallback" }
    });
  }
}
