"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Quote,
  Columns2,
  CheckSquare,
  Table,
} from "lucide-react";
import { slugifySection } from "@/lib/citations";
import { uploadPortfolioMedia } from "@/lib/media-upload";

/* ─── Types ───────────────────────────────────────────────────────── */

type ToolbarAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  action: (
    textarea: HTMLTextAreaElement,
    value: string,
    set: (v: string) => void,
  ) => void;
};

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  minRows?: number;
  placeholder?: string;
};

/* ─── Helpers: cursor manipulation ────────────────────────────────── */

function wrapSelection(
  ta: HTMLTextAreaElement,
  value: string,
  set: (v: string) => void,
  before: string,
  after: string,
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = value.slice(start, end);
  const replacement = `${before}${selected || "text"}${after}`;
  const next = value.slice(0, start) + replacement + value.slice(end);
  set(next);
  requestAnimationFrame(() => {
    ta.focus();
    const newCursorStart = start + before.length;
    const newCursorEnd = newCursorStart + (selected.length || 4);
    ta.setSelectionRange(newCursorStart, newCursorEnd);
  });
}

function insertAtCursor(
  ta: HTMLTextAreaElement,
  value: string,
  set: (v: string) => void,
  text: string,
  cursorOffset?: number,
) {
  const start = ta.selectionStart;
  const next = value.slice(0, start) + text + value.slice(ta.selectionEnd);
  set(next);
  requestAnimationFrame(() => {
    ta.focus();
    const pos = start + (cursorOffset ?? text.length);
    ta.setSelectionRange(pos, pos);
  });
}

function prefixLines(
  ta: HTMLTextAreaElement,
  value: string,
  set: (v: string) => void,
  prefix: string,
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = value.slice(start, end);
  if (selected.includes("\n")) {
    const lines = selected.split("\n").map((line) => `${prefix}${line}`);
    const replacement = lines.join("\n");
    const next = value.slice(0, start) + replacement + value.slice(end);
    set(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, start + replacement.length);
    });
  } else {
    insertAtCursor(ta, value, set, `\n${prefix}`, prefix.length + 1);
  }
}

/* ─── Toolbar definitions ─────────────────────────────────────────── */

const toolbar: ToolbarAction[] = [
  {
    icon: Bold,
    label: "Bold",
    shortcut: "Ctrl+B",
    action: (ta, v, s) => wrapSelection(ta, v, s, "**", "**"),
  },
  {
    icon: Italic,
    label: "Italic",
    shortcut: "Ctrl+I",
    action: (ta, v, s) => wrapSelection(ta, v, s, "_", "_"),
  },
  {
    icon: Heading2,
    label: "Heading",
    action: (ta, v, s) => insertAtCursor(ta, v, s, "\n## ", 4),
  },
  {
    icon: Code,
    label: "Code block",
    action: (ta, v, s) => {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = v.slice(start, end);
      if (selected.includes("\n") || selected.length > 40) {
        wrapSelection(ta, v, s, "\n```\n", "\n```\n");
      } else {
        wrapSelection(ta, v, s, "`", "`");
      }
    },
  },
  {
    icon: Link,
    label: "Link",
    shortcut: "Ctrl+K",
    action: (ta, v, s) => {
      const start = ta.selectionStart;
      const selected = v.slice(start, ta.selectionEnd);
      const text = selected || "link text";
      const insertion = `[${text}](url)`;
      const next = v.slice(0, start) + insertion + v.slice(ta.selectionEnd);
      s(next);
      requestAnimationFrame(() => {
        ta.focus();
        const urlStart = start + text.length + 3;
        ta.setSelectionRange(urlStart, urlStart + 3);
      });
    },
  },
  {
    icon: ImageIcon,
    label: "Image",
    action: (ta, v, s) => insertAtCursor(ta, v, s, "![alt](url)", 6),
  },
  {
    icon: Quote,
    label: "Blockquote",
    action: (ta, v, s) => prefixLines(ta, v, s, "> "),
  },
  {
    icon: List,
    label: "Bullet list",
    action: (ta, v, s) => prefixLines(ta, v, s, "- "),
  },
  {
    icon: ListOrdered,
    label: "Numbered list",
    action: (ta, v, s) => prefixLines(ta, v, s, "1. "),
  },
  {
    icon: CheckSquare,
    label: "Task list",
    action: (ta, v, s) => prefixLines(ta, v, s, "- [ ] "),
  },
  {
    icon: Table,
    label: "Table",
    action: (ta, v, s) =>
      insertAtCursor(
        ta,
        v,
        s,
        "\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell     | Cell     | Cell     |\n",
        11,
      ),
  },
  {
    icon: Minus,
    label: "Horizontal rule",
    action: (ta, v, s) => insertAtCursor(ta, v, s, "\n---\n", 5),
  },
];

/* ─── Markdown preview renderer (client-side) ─────────────────────── */

async function renderMarkdown(source: string): Promise<string> {
  const [
    { unified },
    { default: remarkParse },
    { default: remarkGfm },
    { default: remarkRehype },
    { default: rehypeHighlight },
    { default: rehypeSanitize },
    { default: rehypeStringify },
  ] = await Promise.all([
    import("unified"),
    import("remark-parse"),
    import("remark-gfm"),
    import("remark-rehype"),
    import("rehype-highlight"),
    import("rehype-sanitize"),
    import("rehype-stringify"),
  ]);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(source);

  return String(result).replace(/<h([2-4])>(.*?)<\/h\1>/g, (match, level: string, content: string) => {
    const text = content.replace(/<[^>]+>/g, "").trim();
    return text ? `<h${level} id="${slugifySection(text)}">${content}</h${level}>` : match;
  });
}

/* ─── Image upload helper ─────────────────────────────────────────── */

async function uploadImage(file: File): Promise<string | null> {
  // Validate client-side
  const maxSize = 100 * 1024 * 1024;
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type) || file.size > maxSize) return null;

  return uploadPortfolioMedia(file, "blogs", "/api/media");
}

/* ─── Component ───────────────────────────────────────────────────── */

type ViewMode = "edit" | "preview" | "split";

export function MarkdownEditor({
  value,
  onChange,
  label,
  required,
  minRows = 12,
  placeholder = "Write markdown here…",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, minRows * 24)}px`;
  }, [minRows]);

  // Debounced preview render
  useEffect(() => {
    if (viewMode === "edit") return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsRendering(true);
      renderMarkdown(value).then((html) => {
        setPreviewHtml(html);
        setIsRendering(false);
      });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, viewMode]);

  // Auto-resize on value change
  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Window resize listener for auto-resize
  useEffect(() => {
    window.addEventListener("resize", autoResize);
    return () => window.removeEventListener("resize", autoResize);
  }, [autoResize]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "b") {
        e.preventDefault();
        wrapSelection(ta, value, onChange, "**", "**");
      } else if (mod && e.key === "i") {
        e.preventDefault();
        wrapSelection(ta, value, onChange, "_", "_");
      } else if (mod && e.key === "k") {
        e.preventDefault();
        const start = ta.selectionStart;
        const selected = value.slice(start, ta.selectionEnd);
        const text = selected || "link text";
        const insertion = `[${text}](url)`;
        const next =
          value.slice(0, start) + insertion + value.slice(ta.selectionEnd);
        onChange(next);
        requestAnimationFrame(() => {
          ta.focus();
          const urlStart = start + text.length + 3;
          ta.setSelectionRange(urlStart, urlStart + 3);
        });
      } else if (e.key === "Tab") {
        e.preventDefault();
        insertAtCursor(ta, value, onChange, "  ");
      }
    },
    [value, onChange],
  );

  // Paste handler for images
  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const ta = textareaRef.current;
          if (!ta) continue;

          setUploadProgress("Uploading image…");
          let url: string | null = null;
          try {
            url = await uploadImage(file);
          } finally {
            setUploadProgress(null);
          }

          if (url) {
            const alt = file.name?.replace(/\.[^.]+$/, "") || "image";
            insertAtCursor(
              ta,
              value,
              onChange,
              `![${alt}](${url})`,
            );
          }
          return;
        }
      }
    },
    [value, onChange],
  );

  // Drag & drop handler for images
  const handleDragOver = useCallback((e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length) return;

      const ta = textareaRef.current;
      if (!ta) return;

      setUploadProgress(`Uploading ${files.length} image(s)…`);
      const urls: string[] = [];
      try {
        for (const file of files) {
          const url = await uploadImage(file);
          if (url) {
            const alt = file.name?.replace(/\.[^.]+$/, "") || "image";
            urls.push(`![${alt}](${url})`);
          }
        }
      } finally {
        setUploadProgress(null);
      }

      if (urls.length) {
        insertAtCursor(ta, value, onChange, urls.join("\n\n"));
      }
    },
    [value, onChange],
  );

  // Word & char count
  const stats = useMemo(() => {
    const words = value
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const readTime = Math.max(1, Math.ceil(words / 220));
    return { words, chars: value.length, readTime };
  }, [value]);

  const showEditor = viewMode !== "preview";
  const showPreview = viewMode !== "edit";

  return (
    <div className="markdown-editor">
      {label && (
        <span className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      {/* Toolbar */}
      <div className="md-toolbar">
        <div className="md-toolbar-actions">
          {toolbar.map((item) => (
            <button
              key={item.label}
              type="button"
              title={
                item.shortcut
                  ? `${item.label} (${item.shortcut})`
                  : item.label
              }
              aria-label={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
              onClick={() => {
                const ta = textareaRef.current;
                if (ta) item.action(ta, value, onChange);
              }}
              className="md-toolbar-btn"
            >
              <item.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="md-toolbar-views">
          <button
            type="button"
            title="Edit"
            aria-label="Edit markdown"
            onClick={() => setViewMode("edit")}
            className={`md-toolbar-btn ${viewMode === "edit" ? "md-toolbar-btn-active" : ""}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Split view"
            aria-label="Use split editor and preview"
            onClick={() => setViewMode("split")}
            className={`md-toolbar-btn ${viewMode === "split" ? "md-toolbar-btn-active" : ""}`}
          >
            <Columns2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Preview"
            aria-label="Preview markdown"
            onClick={() => setViewMode("preview")}
            className={`md-toolbar-btn ${viewMode === "preview" ? "md-toolbar-btn-active" : ""}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editor + Preview panes */}
      <div
        className={`md-panes ${viewMode === "split" ? "md-panes-split" : ""}`}
      >
        {showEditor && (
          <div className="md-editor-pane">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              required={required}
              placeholder={placeholder}
              spellCheck
              className={`md-textarea ${isDragOver ? "md-textarea-dragover" : ""}`}
            />
            {uploadProgress && (
              <div className="md-upload-indicator">
                <div className="md-upload-spinner" />
                <span>{uploadProgress}</span>
              </div>
            )}
          </div>
        )}

        {showPreview && (
          <div className="md-preview-pane">
            {isRendering && !previewHtml ? (
              <p className="md-preview-placeholder">Rendering preview…</p>
            ) : previewHtml ? (
              <div
                className="prose-premium"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="md-preview-placeholder">
                Preview will appear here…
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="md-stats">
        <span>{stats.words} words</span>
        <span className="md-stats-sep">·</span>
        <span>{stats.chars} chars</span>
        <span className="md-stats-sep">·</span>
        <span>~{stats.readTime} min read</span>
      </div>
    </div>
  );
}
