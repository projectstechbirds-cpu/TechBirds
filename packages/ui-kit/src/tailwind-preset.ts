import type { Config } from "tailwindcss";

/**
 * Shared Tailwind preset — every frontend extends this.
 * Maps the design tokens from tokens.css onto Tailwind's theme.
 */
const preset: Partial<Config> = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem", lg: "2.5rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        ink: {
          900: "var(--ink-900)",
          700: "var(--ink-700)",
          500: "var(--ink-500)",
          300: "var(--ink-300)",
        },
        paper: {
          DEFAULT: "var(--paper)",
          2: "var(--paper-2)",
          3: "var(--paper-3)",
        },
        line: "var(--line)",
        accent: {
          50: "var(--accent-50)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // token / size / line-height / weight / tracking
        "display-xl": ["88px", { lineHeight: "92px", letterSpacing: "-0.04em", fontWeight: "600" }],
        "display-lg": ["64px", { lineHeight: "68px", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-md": ["48px", { lineHeight: "54px", letterSpacing: "-0.03em", fontWeight: "600" }],
        headline: ["32px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "600" }],
        title: ["22px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        body: ["16px", { lineHeight: "26px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "22px", fontWeight: "400" }],
        mono: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        eyebrow: ["12px", { lineHeight: "16px", letterSpacing: "0.12em", fontWeight: "600" }],
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      transitionTimingFunction: {
        "out-quart": "var(--ease-out-quart)",
      },
      transitionDuration: {
        1: "120ms",
        2: "200ms",
        3: "320ms",
        4: "520ms",
        5: "720ms",
      },
    },
  },
};

export default preset;
