import type { Config } from "tailwindcss";
import preset from "@techbirds/ui-kit/tailwind-preset";

export default {
  presets: [preset as Config],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-kit/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
