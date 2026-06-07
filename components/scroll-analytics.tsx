"use client";

import { useEffect, useRef } from "react";

const thresholds = [25, 50, 75, 100];

export function ScrollAnalytics({
  contentType,
  slug
}: {
  contentType: "PROJECT" | "CASE_STUDY" | "EXPERIMENT" | "BLOG" | "DASHBOARD";
  slug: string;
}) {
  const sent = useRef(new Set<number>());

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const depth = total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 100;
      const threshold = thresholds.find((value) => depth >= value && !sent.current.has(value));
      if (!threshold) return;
      sent.current.add(threshold);
      navigator.sendBeacon?.(
        "/api/reading",
        new Blob([JSON.stringify({ contentType, slug, depth: threshold })], { type: "application/json" })
      );
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [contentType, slug]);

  return null;
}
