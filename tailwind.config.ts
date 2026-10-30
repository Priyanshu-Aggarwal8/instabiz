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
        toffee: {
          DEFAULT: "#c2622b",
          deep: "#a24a1a",
          ink: "#8e3f15",
        },
        honey: {
          DEFAULT: "#f2be6b",
          soft: "#fbe3b4",
        },
        cocoa: {
          DEFAULT: "#2a170e",
          soft: "#5a3a28",
        },
        milk: {
          DEFAULT: "#fffdf8",
        },
        sky: {
          DEFAULT: "#bfddf5",
          deep: "#2f6e9e",
        },
        blush: {
          DEFAULT: "#f9cdbf",
        },
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
        serif: ["var(--font-fraunces)", "serif"],
        scrawl: ["var(--font-shantell)", "cursive"],
        plush: ["var(--font-fraunces)", "serif"],
      },
      boxShadow: {
        sketch: "0 4px 20px -2px rgba(42, 23, 14, 0.08), 0 2px 6px -1px rgba(42, 23, 14, 0.04)",
        ticket: "0 10px 25px -3px rgba(42, 23, 14, 0.1), 0 4px 10px -2px rgba(42, 23, 14, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;

