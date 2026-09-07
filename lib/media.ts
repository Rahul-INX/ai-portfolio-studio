const volatileLinkedInMedia = /^https?:\/\/(?:[\w-]+\.)?(?:linkedin|licdn)\.com\//i;

export function isVolatileExternalMedia(url?: string | null) {
  return typeof url === "string" && volatileLinkedInMedia.test(url);
}

export function resolvePortfolioMedia(url?: string | null) {
  if (!url) return "/media/ai-systems-hero.png";
  if (isVolatileExternalMedia(url)) return "/media/ai-systems-hero.png";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return "/media/ai-systems-hero.png";
}

export function isRenderableProfileImage(url?: string | null) {
  return typeof url === "string" && !isVolatileExternalMedia(url);
}
