import type { MetadataRoute } from "next";
import { getExplorerItems } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const items = await getExplorerItems();
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/cv`, lastModified: new Date() },
    { url: `${base}/explorer`, lastModified: new Date() },
    { url: `${base}/timeline`, lastModified: new Date() },
    ...items.map((item) => ({
      url: `${base}/${item.kind}/${item.slug}`,
      lastModified: item.publishedAt ? new Date(item.publishedAt) : new Date()
    }))
  ];
}
