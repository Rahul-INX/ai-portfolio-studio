import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { getSiteProfile } from "@/lib/content";
import { publicProfileCopy, publicProfileSummary } from "@/lib/public-copy";
import { safeSiteProfile } from "@/lib/safe-content";
import "./globals.css";

export const revalidate = 300;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getSiteProfile();
  const description = publicProfileCopy(profile.seoDescription, publicProfileSummary);
  return {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: { default: profile.seoTitle, template: `%s | ${profile.name}` },
  description,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg"
  },
  openGraph: {
    title: profile.seoTitle,
    description,
    url: "/",
    siteName: profile.name,
    type: "website",
    images: [
      {
        url: "/media/ai-systems-hero.png",
        width: 1672,
        height: 941,
        alt: "Abstract AI systems dashboard visual"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: profile.seoTitle,
    description,
    images: ["/media/ai-systems-hero.png"]
  }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#090d0b" }
  ]
};

const themeScript = `
  try {
    const stored = localStorage.getItem("theme");
    if (stored !== "light") document.documentElement.classList.add("dark");
  } catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="description" content={publicProfileCopy(safeSiteProfile.seoDescription, publicProfileSummary)} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
