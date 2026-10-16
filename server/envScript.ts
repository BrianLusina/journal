/**
 * The VITE_ variables /env.js passes from the container's environment to the browser: exactly
 * the keys src/config reads with readEnv. Anything listed here is public, so never add a secret.
 */
export const CLIENT_ENV_KEYS = [
  'VITE_APP_NAME',
  'VITE_APP_TITLE',
  'VITE_ENV',
  'VITE_CONTENTFUL_CMS_API_KEY',
  'VITE_CONTENTFUL_CMS_BASE_URL',
  'VITE_CONTENTFUL_CMS_GRAPHQL_URL',
  'VITE_CONTENTFUL_CMS_REST_API_URL',
  'VITE_CONTENTFUL_CMS_PREVIEW_REST_API_URL',
  'VITE_CONTENTFUL_CMS_SPACE_ID',
  'VITE_CONTENTFUL_CMS_ENVIRONMENT',
  'VITE_CONTENTFUL_CMS_PREVIEW',
  'VITE_SENTRY_DSN',
  'VITE_SENTRY_TRACES_SAMPLE_RATE',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
] as const;

/**
 * The /env.js script that sets window.__ENV__ to the allowlisted variables set in env. `<` is
 * escaped so no value can close a <script> element, nor U+2028 and U+2029, which older engines
 * reject in string literals.
 */
export function renderEnvScript(env: Record<string, string | undefined>): string {
  const values = Object.fromEntries(
    CLIENT_ENV_KEYS.filter(key => env[key] !== undefined).map(key => [key, env[key]]),
  );
  const json = JSON.stringify(values)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `window.__ENV__ = ${json};\n`;
}
