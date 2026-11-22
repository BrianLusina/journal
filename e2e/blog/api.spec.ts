import { test, expect } from '../fixtures';
import { bypassHeadersFor } from '../lib/env';

// The posts routes' contract on the real host. Unit tests run each handler against mocks; only
// this shows the deployed function loads (its imports included, such as @brianlusina/cms) and
// answers a page of posts.
const SOURCES = [
  // rawKey: a key the CMS's own shape has and a unified post doesn't.
  { source: 'contentful', name: 'Contentful', rawKey: 'sys' },
  { source: 'notion', name: 'Notion', rawKey: 'properties' },
  { source: 'sanity', name: 'Sanity', rawKey: '_type' },
] as const;

/** A post as @brianlusina/cms models it, not as the CMS returned it. */
function expectUnifiedPost(post: Record<string, unknown>, source: string, rawKey: string) {
  expect(post).toMatchObject({
    id: expect.any(String),
    slug: expect.any(String),
    title: expect.any(String),
    publishDate: expect.any(String),
    source,
    tags: expect.any(Array),
    authors: expect.any(Array),
  });
  expect(post).not.toHaveProperty(rawKey);
}

for (const { source, name, rawKey } of SOURCES) {
  test(`GET /api/${source}/posts?limit=1 answers a page of posts`, async ({ request, baseURL }) => {
    if (!baseURL) throw new Error('E2E_BASE_URL is not set');
    const url = new URL(`/api/${source}/posts?limit=1`, baseURL).toString();
    const response = await request.get(url, {
      headers: bypassHeadersFor(url, baseURL, process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
      // Playwright copies headers onto redirects, so a redirect elsewhere would carry the secret.
      maxRedirects: 0,
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
    const [first] = body?.results as Record<string, unknown>[];
    if (first) expectUnifiedPost(first, source, rawKey);
  });
}
