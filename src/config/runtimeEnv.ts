declare global {
  interface Window {
    /**
     * The client configuration the Docker image's server sets in /env.js from the container's
     * environment. On Vercel, public/env.js leaves it empty.
     */
    __ENV__?: Partial<Record<string, string>>;
  }
}

/**
 * A VITE_ variable: the value /env.js set at runtime, else the value Vite inlined at build time.
 * The runtime value lets one Docker image serve any environment; Vercel keeps using the build-time
 * value. A new key must also be added to CLIENT_ENV_KEYS in server/envScript.ts.
 */
export const readEnv = (key: `VITE_${string}`): string | undefined =>
  window.__ENV__?.[key] ?? import.meta.env[key];
