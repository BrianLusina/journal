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
});
