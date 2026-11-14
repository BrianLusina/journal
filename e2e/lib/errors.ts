import { isSameOrigin } from './env';

/** The pages where a 404 is the point of the test: the 404 page, an unknown route and a missing article. */
const NOT_FOUND_PATHS = /^\/(404|this-route-does-not-exist|article\/missing\/missing)$/;

/** Console errors the blog logs on purpose, and the pages where they are expected. */
export const CONSOLE_ALLOWLIST: ReadonlyArray<{ pathname: RegExp; text: RegExp }> = [
  { pathname: NOT_FOUND_PATHS, text: /^404 Error: User attempted to access non-existent route/ },
  { pathname: NOT_FOUND_PATHS, text: /status of 404/ },
];

/** Whether a failed request belongs to the deployment under test, rather than a third party. */
export function isFirstPartyFailure(requestUrl: string, baseURL: string): boolean {
  return isSameOrigin(requestUrl, baseURL);
}

/**
 * Whether a console error should fail a test. Errors raised by a third-party resource (an image
 * CDN, analytics) are ignored, and so are the allowlisted ones on the pages that expect them.
 */
export function isRelevantConsoleError(
  error: { text: string; sourceUrl: string; pathname: string },
  baseURL: string,
): boolean {
  if (error.sourceUrl && !isSameOrigin(error.sourceUrl, baseURL)) return false;

  return !CONSOLE_ALLOWLIST.some(entry => entry.pathname.test(error.pathname) && entry.text.test(error.text));
}
