const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

export function cloudinaryImage(publicId: string, transform = "f_auto,q_auto,w_1600") {
  if (!cloudName || !publicId) return undefined;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export function resolvePortfolioMedia(url?: string | null) {
  if (!url) return "/media/ai-systems-hero.png";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return cloudinaryImage(url) ?? "/media/ai-systems-hero.png";
}
