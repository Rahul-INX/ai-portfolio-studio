import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f4",
          100: "#e8ece4",
          200: "#ccd4c7",
          300: "#aeb9aa",
          400: "#7d8b7b",
          500: "#5d6d5e",
          600: "#455346",
          700: "#303a32",
          800: "#202722",
          900: "#121713",
          950: "#090d0b"
        },
        cobalt: {
          400: "#6f8fc8",
          500: "#4e6fa9",
          600: "#39588e"
        },
        sage: {
          300: "#d4ddcf",
          500: "#7f9572",
          700: "#303a32"
        },
        /* ── Kind colors (split-complementary palette) ────── */
        kind: {
          project:     { light: "#e8f0fe", DEFAULT: "#4e6fa9", dark: "#3a5a8f" },
          "case-study":{ light: "#fef3e0", DEFAULT: "#c8922a", dark: "#a67820" },
          experiment:  { light: "#f0e8fe", DEFAULT: "#7e57c2", dark: "#6741a8" },
          blog:        { light: "#e0f5f3", DEFAULT: "#26897a", dark: "#1e7068" },
          dashboard:   { light: "#fee8ec", DEFAULT: "#c24e6a", dark: "#a83a55" },
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        quiet: "0 18px 60px rgba(8, 13, 11, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
