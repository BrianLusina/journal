import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: true, // Source map generation must be turned on
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),     // Put the Sentry vite plugin after all other plugins
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    }),
  ].filter(Boolean),  
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@assets/*": path.resolve(__dirname, "./src/assets/*"),
            "@icons/*": path.resolve(__dirname, "./src/assets/icons/*"),
            "@images/*": path.resolve(__dirname, "./src/assets/images/*"),
            "@fonts/*": path.resolve(__dirname, "./src/assets/fonts/*"),
            "@app": path.resolve(__dirname, "./src/app/index.ts"),
            "@config": path.resolve(__dirname, "./src/config/index.ts"),
            "@apiConfig": path.resolve(__dirname, "./src/config/api.ts"),
            "@routes": path.resolve(__dirname, "./src/config/routes.ts"),
            "@graphQl/*": path.resolve(__dirname, "./src/clients/graphql/*"),
            "@graphQlQueries": path.resolve(__dirname, "./src/clients/graphql/queries/index.ts"),
            "@graphQlClient": path.resolve(__dirname, "./src/clients/graphql/GraphQlClient.ts"),
            "@contentfulClient": path.resolve(__dirname, "./src/integrations/contentful/index.ts"),
            "@providers/*": path.resolve(__dirname, "./src/providers/*"),
            "@components": path.resolve(__dirname, "./src/components/index.ts"),
            "@containers/*": path.resolve(__dirname, "./src/containers/*"),
            "@features/*": path.resolve(__dirname, "./src/features/*"),
            "@pages/*": path.resolve(__dirname, "./src/pages/*"),
            "@layouts/*": path.resolve(__dirname, "./src/layouts/*"),
            "@utils": path.resolve(__dirname, "./src/utils/utils.ts"),
            "@timeUtils": path.resolve(__dirname, "./src/utils/time/timeUtils.ts"),
            "@timeConstants": path.resolve(__dirname, "./src/utils/time/constants.ts"),
            "@hooks": path.resolve(__dirname, "./src/hooks/index.ts"),
            "@analyticsHooks": path.resolve(__dirname, "./src/hooks/analytics/index.ts"),
            "@apiHooks": path.resolve(__dirname, "./src/hooks/api/index.ts"),
            "@cmsHooks": path.resolve(__dirname, "./src/hooks/cms/index.ts"),
            "@utilsHooks": path.resolve(__dirname, "./src/hooks/utils/index.ts"),
            "@services": path.resolve(__dirname, "./src/services/index.ts"),
            "@monitoring": path.resolve(__dirname, "./src/services/monitoring/index.ts"),
            "@analytics": path.resolve(__dirname, "./src/services/analytics/index.ts"),
            "@cmsService": path.resolve(__dirname, "./src/services/cms/index.ts"),
            "@firebaseClient": path.resolve(__dirname, "./src/services/firebase/index.ts"),
            "@features": path.resolve(__dirname, "./src/features/index.ts"),
            "@testUtils/*": path.resolve(__dirname, "./src/test/*"),
            "@styles/*": path.resolve(__dirname, "./src/styles/*"),
            "@styled/*": path.resolve(__dirname, "./src/styles/ts/*"),
            "@scss/*": path.resolve(__dirname, "./src/styles/scss/*"),
            "@css/*": path.resolve(__dirname, "./src/styles/css/*") 
        }
    }
}));
