"use client";

import Link from "next/link";
import { Bot, RotateCcw, Send, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const basePrompts = [
  "What are the strongest projects in this portfolio?",
  "Explain the RAG experience in this portfolio.",
  "What data science evidence should a recruiter notice?"
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const chatStorageKey = "portfolio-assistant-messages";
const STREAM_RENDER_DELAY_MS = 14;
const STREAM_RENDER_CHARS = 3;
const messageIdPattern = /^(?:user|assistant)-(\d+)$/;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function revealText(
  text: string,
  onPiece: (piece: string) => void
) {
  for (let index = 0; index < text.length; index += STREAM_RENDER_CHARS) {
    onPiece(text.slice(index, index + STREAM_RENDER_CHARS));
    await wait(STREAM_RENDER_DELAY_MS);
  }
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match bold, inline code, and links
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-black/5 dark:bg-white/10 px-1 py-0.5 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      const external = /^https?:\/\//.test(href);
      return (
        <a
          key={index}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-cobalt-600 dark:text-cobalt-400 underline hover:opacity-85 decoration-1"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

function MarkdownText({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.slice(2);
          return (
            <ul key={lineIndex} className="list-disc pl-4 space-y-0.5">
              <li>{parseInlineMarkdown(content)}</li>
            </ul>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, "");
          return (
            <ol key={lineIndex} className="list-decimal pl-4 space-y-0.5">
              <li>{parseInlineMarkdown(content)}</li>
            </ol>
          );
        }
        if (!trimmed) {
          return <div key={lineIndex} className="h-0.5" />;
        }
        return <p key={lineIndex}>{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function getHighestMessageId(messages: ChatMessage[]) {
  return messages.reduce((highestId, message) => {
    const match = message.id.match(messageIdPattern);
    if (!match) return highestId;
    return Math.max(highestId, Number(match[1]));
  }, 0);
}

export function PortfolioAssistant({ ownerName }: { ownerName: string }) {
  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: `Hi! I'm ${ownerName}'s Portfolio Copilot. Ask me about projects, skills, experience, or technical evidence.`
  };
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [welcomeMessage];
    try {
      const saved = window.sessionStorage.getItem(chatStorageKey);
      if (!saved) return [welcomeMessage];
      const parsed = JSON.parse(saved) as ChatMessage[];
      return Array.isArray(parsed) && parsed.length ? parsed : [welcomeMessage];
    } catch {
      return [welcomeMessage];
    }
  });
  const [loading, setLoading] = useState(false);
  
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const messageIdRef = useRef(getHighestMessageId(messages));

  useEffect(() => {
    messagesRef.current = messages;
    try {
      window.sessionStorage.setItem(chatStorageKey, JSON.stringify(messages));
    } catch {
      // Ignore storage limits or private browsing restrictions.
    }
  }, [messages]);

  function nextMessageId(prefix: string) {
    messageIdRef.current += 1;
    return `${prefix}-${messageIdRef.current}`;
  }

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
    inputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  async function ask(nextMessage = message) {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage) return;

    const userMsgId = nextMessageId("user");
    const assistantMsgId = nextMessageId("assistant");

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: trimmedMessage
    };
    const historySource = messagesRef.current;
    const updatedMessages = [...historySource, userMessage];

    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      // Build history excluding welcome message
      const historyList = historySource
        .filter((msg) => msg.id !== "welcome")
        .map((msg) => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          history: historyList,
          path: window.location.pathname
        })
      });

      if (!response.body) {
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: "No stream returned." }
        ]);
        return;
      }

      // Add the empty assistant response bubble
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" }
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        await revealText(chunk, (piece) =>
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + piece }
                : msg
            )
          )
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "Something went wrong while thinking. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      suppressHydrationWarning
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-5 sm:right-5"
    >
      {open ? (
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="portfolio-assistant-title" className="surface flex max-h-[calc(100dvh-7rem)] w-full flex-col overflow-hidden rounded-lg p-4 shadow-2xl sm:w-[min(34rem,calc(100vw-2.5rem))]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
                Portfolio Copilot
              </p>
              <h2 id="portfolio-assistant-title" className="mt-1 text-base font-semibold tracking-normal">Ask {ownerName}&apos;s portfolio</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMessages([welcomeMessage]);
                  window.sessionStorage.removeItem(chatStorageKey);
                  setMessage("");
                }}
                disabled={loading || messages.length <= 1}
                aria-label="Clear portfolio assistant chat"
                title="Clear chat"
                className="grid h-9 w-9 place-items-center rounded-md border hairline transition hover:border-cobalt-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close portfolio assistant"
                className="grid h-9 w-9 place-items-center rounded-md border hairline transition hover:border-cobalt-500"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div
            ref={messageListRef}
            className="mt-4 flex h-[clamp(16rem,48dvh,30rem)] min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin scroll-smooth"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-0.5 px-1">
                  {msg.role === "user" ? "You" : "Copilot"}
                </span>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-6 shadow-sm ${
                    msg.role === "user"
                      ? "bg-cobalt-600 text-white rounded-tr-none"
                      : "border hairline bg-[var(--panel-strong)] rounded-tl-none text-[color-mix(in_srgb,var(--foreground),transparent_15%)]"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <MarkdownText text={msg.content} />
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-0.5 px-1">
                  Copilot
                </span>
                <div className="rounded-2xl rounded-tl-none border hairline bg-[var(--panel-strong)] px-3.5 py-2 text-xs shadow-sm text-sage-500">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    <span className="animate-bounce [animation-delay:0.4s]">●</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts (only visible when in initial state) */}
          {messages.length <= 1 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t hairline pt-3">
              <p className="text-[10px] uppercase tracking-wider text-sage-500 font-semibold mb-1">
                Suggested Questions
              </p>
              {basePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void ask(prompt)}
                  className="rounded-md border hairline bg-[var(--panel-strong)] px-3 py-2 text-left text-xs transition hover:border-cobalt-500 hover:text-[var(--foreground)]"
                >
                  {prompt}
                </button>
              ))}
              <Link
                href="/job-fit"
                onClick={() => setOpen(false)}
                className="rounded-md border hairline bg-ink-900 px-3 py-2 text-left text-xs font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950"
              >
                Check this portfolio against a JD
              </Link>
            </div>
          )}

          {/* Form Input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(message);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              ref={inputRef}
              id="portfolio-question"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask a question..."
              className="h-11 min-w-0 flex-1 rounded-md border hairline bg-[var(--panel-strong)] px-3 text-xs outline-none focus:border-cobalt-500"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              aria-label="Ask portfolio assistant"
              className="grid h-11 w-11 place-items-center rounded-md bg-ink-900 text-white transition hover:bg-cobalt-600 disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
            >
              <Send aria-hidden className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open portfolio assistant"
        className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-ink-900 px-4 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950"
      >
        <Bot aria-hidden className="h-5 w-5" />
        <span className="hidden sm:inline">Ask my portfolio</span>
      </button>
    </div>
  );
}
