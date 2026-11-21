import type { Config } from 'tailwindcss';
import preset, { uiContent } from '@brianlusina/ui/tailwind-preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{astro,ts,tsx}', ...uiContent],
} satisfies Config;
