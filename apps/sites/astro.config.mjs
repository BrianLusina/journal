import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// The adapter seam: the only line that names the host. A Node build for Docker swaps this for
// @astrojs/node (#928, spec section 8); add it when there's a need.
const adapter = vercel();

// Server-rendered, with no ISR: ISR caches by path, and home and folio share paths across their
// hostnames (see "apps/sites" in docs/ARCHITECTURE.md).
export default defineConfig({
  output: 'server',
  adapter,
  integrations: [react()],
  // The dev toolbar's module only exists under `astro dev`; off, so local E2E runs see a clean console.
  devToolbar: { enabled: false },
  vite: {
    ssr: {
      // Astro's runtime is bundled into dist/server, so an import it leaves external is resolved
      // from there, up to the repo root, where the blog's older versions are hoisted (cookie 0.4,
      // which lacks parseCookie, so every request was a 500 on Vercel). Bundling them pins
      // Astro's own versions.
      noExternal: ['cookie', 'picomatch'],
    },
  },
});
