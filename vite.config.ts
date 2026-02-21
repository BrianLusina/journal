import { defineConfig, loadEnv, normalizePath } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { sentryVitePlugin } from "@sentry/vite-plugin";
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
      BUGSNAG_API_KEY: JSON.stringify(env.VITE_BUGSNAG_API_KEY),
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
      alias: {
        "@": path.resolve(__dirname, "./src"),
        '@components': path.resolve(__dirname, './src/components'),
        '@icons': path.resolve(__dirname, './src/assets/icons'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@images': path.resolve(__dirname, './src/assets/images'),
        '@fonts': path.resolve(__dirname, './src/assets/fonts'),
        '@app': path.resolve(__dirname, './src/app/index.ts'),
        '@config': path.resolve(__dirname, './src/config/index.ts'),
        '@apiConfig': path.resolve(__dirname, './src/config/api.ts'),
        '@routes': path.resolve(__dirname, './src/config/routes.ts'),
        '@graphQl': path.resolve(__dirname, './src/api/graphql'),
        '@graphQlClient': path.resolve(__dirname, './src/api/graphql/GraphqlClient.ts'),
        '@providers': path.resolve(__dirname, './src/providers'),
        '@containers': path.resolve(__dirname, './src/containers'),
        '@features': path.resolve(__dirname, './src/features'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@utils': path.resolve(__dirname, './src/utils/utils.ts'),
        '@lib': path.resolve(__dirname, './src/lib/index.ts'),
        '@timeUtils': path.resolve(__dirname, './src/utils/time/timeUtils.ts'),
        '@timeConstants': path.resolve(__dirname, './src/utils/time/constants.ts'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@monitoring': path.resolve(__dirname, './src/services/monitoring/index.ts'),
        '@analytics': path.resolve(__dirname, './src/services/analytics/index.ts'),
        '@testUtils': path.resolve(__dirname, './src/test'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@styled': path.resolve(__dirname, './src/styles/ts'),
        '@scss': path.resolve(__dirname, './src/styles/scss'),
        '@css': path.resolve(__dirname, './src/styles/css')        
      }
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