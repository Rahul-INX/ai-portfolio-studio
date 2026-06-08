"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationFeedback() {
  const pathname = usePathname();
  const [destinationPath, setDestinationPath] = useState<string | null>(null);
  const loading = destinationPath !== null && destinationPath !== pathname;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;

      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setDestinationPath(url.pathname);
    }

    window.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100]" role="status" aria-live="polite">
      <div className="h-1 overflow-hidden bg-[color-mix(in_srgb,var(--accent),transparent_82%)]">
        <div className="navigation-progress h-full w-1/2 bg-[var(--accent)]" />
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border hairline bg-[var(--panel-strong)] px-4 py-2 text-xs font-semibold shadow-lg">
        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin text-[var(--accent)]" />
        Loading page, please wait...
      </div>
    </div>
  );
}
