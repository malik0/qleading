/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)",
          glow: "var(--color-primary-glow)",
          sky: "#38bdf8",
          dark: "#0b1329",
          card: "#131f37",
          border: "#1e293b",
        },
        surface: {
          base: "var(--bg-base)",
          card: "var(--bg-card)",
          subtle: "var(--bg-card-subtle)",
          hover: "var(--bg-card-hover)",
          border: "var(--border-base)",
          "border-subtle": "var(--border-subtle)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        arabic: ['"Amiri"', '"Scheherazade New"', 'serif'],
      },
    },
  },
  plugins: [],
};
