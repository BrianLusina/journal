import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // process.env does not include .env files; loadEnv reads them (all keys, not only VITE_*).
  const env = loadEnv(mode, process.cwd(), '');

  return {
    build: {
      sourcemap: true, // Source map generation must be turned on
    },
    server: {
      host: '::',
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      // Resolves the path aliases declared in tsconfig.app.json, the single source of truth for them.
      tsconfigPaths(),
      // Put the Sentry vite plugin after all other plugins
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
      }),
    ].filter(Boolean),
  };
});
