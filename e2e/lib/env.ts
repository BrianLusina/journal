/** The deployment under test: `E2E_BASE_URL`, trimmed and without a trailing slash. */
export function resolveBaseURL(env: NodeJS.ProcessEnv): string | undefined {
  const value = env.E2E_BASE_URL?.trim().replace(/\/+$/, '');

  return value || undefined;
}

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/** Whether `url` is served by the deployment under test. A URL that doesn't parse is not. */
export function isSameOrigin(url: string, baseURL: string): boolean {
  const origin = originOf(url);

  return origin !== undefined && origin === originOf(baseURL);
}

/**
 * The headers that let a request through Vercel's Deployment Protection. They go only to the
 * deployment under test, so the secret never reaches a third-party host such as a CDN or analytics.
 */
export function bypassHeadersFor(
  requestUrl: string,
  baseURL: string,
  secret: string | undefined,
): Record<string, string> {
  if (!secret || !isSameOrigin(requestUrl, baseURL)) return {};

  return { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' };
}
