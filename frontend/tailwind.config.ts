import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#0B6B4F",
          hover: "#08513C",
          tint: "#E9F3EE",
        },
        ink: {
          DEFAULT: "#101828",
          secondary: "#475467",
          muted: "#667085",
        },
        accent: {
          DEFAULT: "#F5B547",
          dark: "#8A4B00",
          tint: "#FFF4E0",
        },
        error: {
          DEFAULT: "#B42318",
          tint: "#FEF3F2",
        },
        info: {
          DEFAULT: "#1D3A8A",
          tint: "#EEF4FF",
        },
        role: {
          customer: "#1D4ED8",
          owner: "#0B6B4F",
          driver: "#B45309",
          pickdrop: "#6D28D9",
          movers: "#C2410C",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F7F8FA",
          canvas: "#F4F7F5",
          border: "#EEF0F2",
          borderDark: "#E4E7EC",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
