import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Rahul Harivansh Fatyal | Senior AI Engineer",
    template: "%s | Rahul Harivansh Fatyal"
  },
  description:
    "A premium AI engineering portfolio and knowledge hub focused on RAG, MLOps, structured extraction, analytics, and trustworthy AI systems.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg"
  },
  openGraph: {
    title: "Rahul Harivansh Fatyal | Senior AI Engineer",
    description:
      "Portfolio and knowledge hub for production-grade AI engineering, data science, and evaluation systems.",
    url: "/",
    siteName: "Rahul Harivansh Fatyal",
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
    title: "Rahul Harivansh Fatyal | Senior AI Engineer",
    description: "AI engineering portfolio, case studies, experiments, and technical writing.",
    images: ["/media/ai-systems-hero.png"]
  }
};

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
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) document.documentElement.classList.add("dark");
  } catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
