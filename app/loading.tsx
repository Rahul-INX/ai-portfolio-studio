import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[1600px] place-items-center px-4" role="status" aria-live="polite">
      <div className="surface flex items-center gap-3 rounded-lg px-5 py-4">
        <LoaderCircle aria-hidden className="h-5 w-5 animate-spin text-[var(--accent)]" />
        <div>
          <p className="text-sm font-semibold">Loading content</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Please wait while the page is prepared.</p>
        </div>
      </div>
    </div>
  );
}
