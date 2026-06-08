import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rahul Harivansh Fatyal Portfolio",
    short_name: "Rahul AI",
    description: "Senior AI Engineer portfolio and knowledge hub.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d0b",
    theme_color: "#121713",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
