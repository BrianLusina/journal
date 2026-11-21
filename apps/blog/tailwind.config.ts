import type { Config } from "tailwindcss";
import preset, { uiContent } from "@brianlusina/ui/tailwind-preset";

// The design system lives in @brianlusina/ui; this config only says where the blog uses its classes.
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", ...uiContent],
  prefix: "",
} satisfies Config;
