import { isSameOrigin } from './env';

/** The pages where a 404 is the point of the test: the 404 page, an unknown route and a missing article. */
const NOT_FOUND_PATHS = /^\/(404|this-route-does-not-exist|article\/missing\/missing)$/;

/** Console errors the blog logs on purpose, and the pages where they are expected. */
export const CONSOLE_ALLOWLIST: ReadonlyArray<{ pathname: RegExp; text: RegExp }> = [
  { pathname: NOT_FOUND_PATHS, text: /^404 Error: User attempted to access non-existent route/ },
  { pathname: NOT_FOUND_PATHS, text: /status of 404/ },
];

/**
 * First-party responses that are expected to fail. `KNOWN_DEFECTS` are real bugs recorded so the
 * suite stays green against production; each names its issue, and is removed when that is fixed.
 */
const EXPECTED_MISSES: ReadonlyArray<{ url: RegExp; status: number }> = [
  // Opening an article asks every CMS for the slug; the sources that don't have it answer 404.
  { url: /\/api\/(notion|contentful)\/posts\/[^/?]+$/, status: 404 },
];

export const KNOWN_DEFECTS: ReadonlyArray<{ url: RegExp; status: number; issue: string }> = [
  { url: /\/api\/notion\/posts\?(.*&)?category=/, status: 502, issue: 'BrianLusina/journal#945' },
];

/** Whether a first-party response with this URL and status is expected (see above). */
export function isExpectedFailure(url: string, status: number): boolean {
  return [...EXPECTED_MISSES, ...KNOWN_DEFECTS].some(entry => entry.status === status && entry.url.test(url));
}

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

  const status = /status of (\d{3})/.exec(error.text)?.[1];
  if (status && isExpectedFailure(error.sourceUrl, Number(status))) return false;

  return !CONSOLE_ALLOWLIST.some(entry => entry.pathname.test(error.pathname) && entry.text.test(error.text));
}
