"use client";

import { Download, FileDown, MessageCircle, Send, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Inquiry = {
  id: string;
  persisted: boolean;
  status: string;
  briefAvailable?: boolean;
  sourceAvailable?: boolean;
};
type Event = { id: string; stage: string; status: string; detail: string };
type Message = { role: "user" | "assistant"; content: string };

export function JobFitFollowUp({
  inquiry,
  onResearchComplete,
}: {
  inquiry: Inquiry | null;
  onResearchComplete?: () => void;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [actionError, setActionError] = useState("");
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );

  useEffect(() => {
    if (!inquiry?.persisted) return;
    const source = new EventSource(
      `/api/job-fit/inquiries/${encodeURIComponent(inquiry.id)}/events`,
    );
    source.addEventListener("stage", (event) => {
      try {
        const value = JSON.parse((event as MessageEvent<string>).data) as Event;
        setEvents((current) =>
          current.some((item) => item.id === value.id)
            ? current
            : [...current, value],
        );
        if (
          value.stage === "research" &&
          ["complete", "failed", "not-configured"].includes(value.status)
        )
          onResearchComplete?.();
      } catch {
        /* Ignore malformed progress events. */
      }
    });
    return () => source.close();
  }, [inquiry, onResearchComplete]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = message.trim();
    if (!next || !inquiry?.persisted || loading) return;
    setMessages((current) => [
      ...current,
      { role: "user", content: next },
      { role: "assistant", content: "" },
    ]);
    setMessage("");
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35_000);
    try {
      const response = await fetch(
        `/api/job-fit/inquiries/${encodeURIComponent(inquiry.id)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: next }),
          signal: controller.signal,
        },
      );
      if (!response.ok || !response.body)
        throw new Error("The Job Fit chat is unavailable.");
      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        answer += decoder.decode(chunk.value, { stream: true });
        setMessages((current) => [
          ...current.slice(0, -1),
          { role: "assistant", content: answer },
        ]);
      }
    } catch (error) {
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The Job Fit chat is unavailable.",
        },
      ]);
    } finally {
      window.clearTimeout(timeout);
      readerRef.current = null;
      setLoading(false);
    }
  }

  async function share() {
    if (!inquiry?.persisted) return;
    setActionError("");
    try {
      const response = await fetch(
        `/api/job-fit/inquiries/${encodeURIComponent(inquiry.id)}/share`,
        { method: "POST" },
      );
      const value = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !value.url)
        throw new Error(value.error ?? "Could not create a share link.");
      setShareUrl(new URL(value.url, window.location.origin).toString());
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not create a share link.",
      );
    }
  }

  if (!inquiry?.persisted)
    return (
      <section className="surface rounded-xl p-5 sm:p-6">
        <p className="eyebrow">Follow-up chat</p>
        <h2 className="mt-2 text-xl font-semibold">
          Save this inquiry to continue
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Set the Job Fit data-encryption secret and apply the local database
          schema to retain this JD, replay progress, and continue the
          evidence-grounded conversation.
        </p>
      </section>
    );
  const latestResearchEvent = events.findLast(
    (event) => event.stage === "research",
  );
  const researchRunning =
    latestResearchEvent &&
    !["complete", "failed", "not-configured"].includes(
      latestResearchEvent.status,
    );
  return (
    <section
      className="surface rounded-xl p-5 sm:p-6"
      aria-label="Job Fit follow-up chat"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <MessageCircle
            aria-hidden
            className="mt-0.5 h-5 w-5 text-cobalt-500"
          />
          <div>
            <p className="eyebrow">Follow-up chat</p>
            <h2 className="mt-2 text-xl font-semibold">
              Ask about this exact fit assessment
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Responses stream from the configured provider and remain limited
              to this inquiry’s cited evidence.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {inquiry.sourceAvailable ? (
            <a
              download
              href={`/api/job-fit/inquiries/${encodeURIComponent(inquiry.id)}/source`}
              className="inline-flex h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-medium hover:border-cobalt-500"
            >
              <FileDown aria-hidden className="h-4 w-4" /> Original JD
            </a>
          ) : null}
          {inquiry.briefAvailable ? (
            <a
              download
              href={`/api/job-fit/inquiries/${encodeURIComponent(inquiry.id)}/brief`}
              className="inline-flex h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-medium hover:border-cobalt-500"
            >
              <Download aria-hidden className="h-4 w-4" /> Download brief
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-medium hover:border-cobalt-500"
          >
            <Share2 aria-hidden className="h-4 w-4" /> Create 14-day brief link
          </button>
        </div>
      </div>
      {shareUrl ? (
        <p className="mt-4 break-all rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
          Recruiter link:{" "}
          <a className="underline" href={shareUrl}>
            {shareUrl}
          </a>
        </p>
      ) : null}
      {actionError ? (
        <p
          role="alert"
          className="mt-4 text-sm text-rose-700 dark:text-rose-300"
        >
          {actionError}
        </p>
      ) : null}
      {researchRunning ? (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {latestResearchEvent.detail}
        </p>
      ) : null}
      <div className="mt-5 space-y-3 rounded-lg border hairline bg-[var(--panel-strong)] p-4">
        {messages.length ? (
          messages.map((item, index) => (
            <p
              key={`${item.role}-${index}`}
              className={
                item.role === "assistant"
                  ? "text-sm leading-6 text-[var(--muted)]"
                  : "text-sm font-medium"
              }
            >
              {item.content || "Thinking…"}
            </p>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Try: “Which project should Rahul lead with for this role?”
          </p>
        )}
      </div>
      <form onSubmit={(event) => void send(event)} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="job-fit-follow-up">
          Ask a follow-up question
        </label>
        <input
          id="job-fit-follow-up"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={loading}
          maxLength={1500}
          placeholder="Ask about fit, evidence, gaps, or interview positioning"
          className="h-11 min-w-0 flex-1 rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm outline-none focus:border-cobalt-500"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
        >
          <Send aria-hidden className="h-4 w-4" /> Send
        </button>
      </form>
    </section>
  );
}
