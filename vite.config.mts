import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path'

const pathSrc = path.resolve(__dirname, './src')

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      CMS_API_KEY: JSON.stringify(env.VITE_CMS_API_KEY),
      CMS_GRAPHQL_URL: JSON.stringify(env.VITE_CMS_GRAPHQL_URL),
      CMS_REST_API_URL: JSON.stringify(env.VITE_CMS_REST_API_URL),
      CMS_PREVIEW_REST_API_URL: JSON.stringify(env.VITE_CMS_PREVIEW_REST_API_URL),
      CMS_ENVIRONMENT: JSON.stringify(env.VITE_CMS_ENVIRONMENT),
      CMS_PREVIEW: JSON.stringify(env.VITE_CMS_PREVIEW),
      FIREBASE_API_KEY: JSON.stringify(env.VITE_FIREBASE_API_KEY),
      FIREBASE_AUTH_DOMAIN: JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      FIREBASE_PROJECT_ID: JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      FIREBASE_STORAGE_BUCKET: JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      FIREBASE_APP_ID: JSON.stringify(env.VITE_FIREBASE_APP_ID),
      FIREBASE_MEASUREMENT_ID: JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
    },
    plugins: [
      react(),
      tsconfigPaths(),
      sentryVitePlugin({
        org: process.env.VITE_SENTRY_ORG,
        project: process.env.VITE_SENTRY_PROJECT,
        // Auth tokens can be obtained from https://sentry.io/orgredirect/organizations/:orgslug/settings/auth-tokens/
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      }),
    ],
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