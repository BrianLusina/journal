import { test, expect } from '../fixtures';
import { bypassHeadersFor } from '../lib/env';

// The posts routes' contract on the real host. Unit tests run each handler against mocks; only
// this shows the deployed function loads (its imports included, such as @brianlusina/cms) and
// answers a page of posts.
const SOURCES = [
  { source: 'contentful', name: 'Contentful' },
  { source: 'notion', name: 'Notion' },
] as const;

for (const { source, name } of SOURCES) {
  test(`GET /api/${source}/posts?limit=1 answers a page of posts`, async ({ request, baseURL }) => {
    if (!baseURL) throw new Error('E2E_BASE_URL is not set');
    const url = new URL(`/api/${source}/posts?limit=1`, baseURL).toString();
    const response = await request.get(url, {
      headers: bypassHeadersFor(url, baseURL, process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
    });
    const text = await response.text();

    // A deployment without this source's variables answers this on purpose. A crashed function
    // answers 500 too, but not with this JSON body, so it still fails below.
    let body: { error?: string; results?: unknown; nextCursor?: unknown } | undefined;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
    test.skip(
      response.status() === 500 && body?.error === `${name} is not configured`,
      `${name} is not configured on this deployment`,
    );

    expect(response.status(), text.slice(0, 500)).toBe(200);
    expect(Array.isArray(body?.results)).toBe(true);
    expect(body).toHaveProperty('nextCursor');
  });
}
