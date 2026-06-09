export function resolvePortfolioMedia(url?: string | null) {
  if (!url) return "/media/ai-systems-hero.png";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return "/media/ai-systems-hero.png";
}
