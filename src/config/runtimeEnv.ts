declare global {
  interface Window {
    /**
     * The client configuration the Docker image's server sets in index.html from the container's
     * environment. Elsewhere, as on Vercel, index.html's inline script leaves it empty.
     */
    __ENV__?: Partial<Record<string, string>>;
  }
}

// Each key is read by name, so Vite inlines these values only. A computed key would make Vite
// inline every VITE_ variable present at build time. A new key must also be added to
// CLIENT_ENV_KEYS in server/envScript.ts.
const buildTimeEnv = {
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
  VITE_ENV: import.meta.env.VITE_ENV,
  VITE_CONTENTFUL_CMS_API_KEY: import.meta.env.VITE_CONTENTFUL_CMS_API_KEY,
  VITE_CONTENTFUL_CMS_BASE_URL: import.meta.env.VITE_CONTENTFUL_CMS_BASE_URL,
  VITE_CONTENTFUL_CMS_GRAPHQL_URL: import.meta.env.VITE_CONTENTFUL_CMS_GRAPHQL_URL,
  VITE_CONTENTFUL_CMS_REST_API_URL: import.meta.env.VITE_CONTENTFUL_CMS_REST_API_URL,
  VITE_CONTENTFUL_CMS_PREVIEW_REST_API_URL: import.meta.env.VITE_CONTENTFUL_CMS_PREVIEW_REST_API_URL,
  VITE_CONTENTFUL_CMS_SPACE_ID: import.meta.env.VITE_CONTENTFUL_CMS_SPACE_ID,
  VITE_CONTENTFUL_CMS_ENVIRONMENT: import.meta.env.VITE_CONTENTFUL_CMS_ENVIRONMENT,
  VITE_CONTENTFUL_CMS_PREVIEW: import.meta.env.VITE_CONTENTFUL_CMS_PREVIEW,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_SENTRY_TRACES_SAMPLE_RATE: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * A VITE_ variable: the value index.html set at runtime, else the value Vite inlined at build time.
 * The runtime value lets one Docker image serve any environment; Vercel keeps using the build-time
 * value.
 */
export const readEnv = (key: keyof typeof buildTimeEnv): string | undefined =>
  window.__ENV__?.[key] ?? buildTimeEnv[key];
