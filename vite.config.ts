import { defineConfig, loadEnv, normalizePath } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { resolve } from "node:path";
import { createRequire } from 'node:module';
import path from 'path'

const pathSrc = path.resolve(__dirname, './src')
const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      CMS_TOKEN: JSON.stringify(env.VITE_CMS_TOKEN),
      CMS_GRAPHQL_URL: JSON.stringify(env.VITE_CMS_GRAPHQL_URL),
      CMS_REST_API_URL: JSON.stringify(env.VITE_CMS_REST_API_URL),
    },
    plugins: [
      react(),
    //   tsconfigPaths(),
      sentryVitePlugin({
        org: process.env.VITE_SENTRY_ORG,
        project: process.env.VITE_SENTRY_PROJECT,
        // Auth tokens can be obtained from https://sentry.io/orgredirect/organizations/:orgslug/settings/auth-tokens/
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      }),
    ],
    resolve: {
      alias: [
        {
          find: '@components', replacement: resolve(__dirname, './src/components'),
        }
      ]
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "${pathSrc}/assets/styles/scss/utils";
            
          `
        }
      }
    }
  }
})