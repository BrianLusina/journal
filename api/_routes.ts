import type { VercelResponse } from '@vercel/node';

// Files and folders whose name starts with an underscore are not deployed as functions, so this
// holds what every CMS route has in common.

/** Edge caching for post responses: fresh for a minute, then served stale while revalidating. */
export const POSTS_CACHE_CONTROL = 's-maxage=60, stale-while-revalidate=300';

export function methodNotAllowed(response: VercelResponse): VercelResponse {
  response.setHeader('Allow', 'GET');
  return response.status(405).json({ error: 'Method not allowed' });
}

/** The `limit` query parameter, clamped to 1-100 and defaulting to 100. */
export function getLimit(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 100;

  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

/** A query parameter that is a non-empty string, such as `cursor` or `tag`. */
export function getParam(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}
