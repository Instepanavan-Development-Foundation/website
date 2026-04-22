import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-armenian)", "system-ui", "sans-serif"],
        armenian: ["var(--font-noto-armenian)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        cream: {
          50: "#FFFBF5",
          100: "#FFF4EB",
          200: "#F5EADB",
          300: "#F0DFCA",
        },
        ink: {
          DEFAULT: "#1F1712",
          body: "#4A3E32",
          muted: "#6B5E4E",
          meta: "#8A7E6E",
        },
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter2: "-0.025em",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#1F1712",
            divider: "#F5EADB",
            focus: "#E65A2A",
            content1: "#FFFFFF",
            content2: "#FFFBF5",
            content3: "#FFF4EB",
            content4: "#F5EADB",
            default: {
              50: "#FFFBF5",
              100: "#FFF4EB",
              200: "#F5EADB",
              300: "#F0DFCA",
              400: "#8A7E6E",
              500: "#6B5E4E",
              600: "#4A3E32",
              700: "#3A2F25",
              800: "#2A221B",
              900: "#1F1712",
              foreground: "#1F1712",
              DEFAULT: "#FFF4EB",
            },
            primary: {
              50: "#FFF4EB",
              100: "#FFE7D2",
              200: "#FFCDAA",
              300: "#FFB088",
              400: "#FF8A5C",
              500: "#E65A2A",
              600: "#C94516",
              700: "#A1350F",
              800: "#7A2608",
              900: "#4F1804",
              foreground: "#FFFFFF",
              DEFAULT: "#E65A2A",
            },
            secondary: {
              50: "#FFF4EB",
              100: "#FFE7D2",
              200: "#FFC9A0",
              300: "#FFB088",
              400: "#FF8A5C",
              500: "#E65A2A",
              600: "#C94516",
              700: "#A1350F",
              800: "#7A2608",
              900: "#4F1804",
              foreground: "#FFFFFF",
              DEFAULT: "#E65A2A",
            },
            success: {
              50: "#FFF4EB",
              500: "#E65A2A",
              foreground: "#FFFFFF",
              DEFAULT: "#E65A2A",
            },
            danger: {
              50: "#FFEEEA",
              500: "#C8367E",
              foreground: "#FFFFFF",
              DEFAULT: "#C8367E",
            },
          },
          layout: {
            radius: {
              small: "10px",
              medium: "16px",
              large: "20px",
            },
            borderWidth: {
              small: "1px",
              medium: "1px",
              large: "2px",
            },
          },
        },
      },
    }),
    require("@tailwindcss/typography"),
  ],
};
