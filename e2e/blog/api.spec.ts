import { test, expect } from '../fixtures';
import { bypassHeadersFor } from '../lib/env';

// The posts routes' contract on the real host. Unit tests run each handler against mocks; only
// this shows the deployed function loads (its imports included, such as @brianlusina/cms) and
// answers a page of posts.
const SOURCES = [
  { source: 'contentful', name: 'Contentful', unified: true },
  { source: 'notion', name: 'Notion', unified: false },
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

for (const { source, name, unified } of SOURCES) {
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
    const [first] = body?.results as Record<string, unknown>[];
    if (unified && first) expectUnifiedPost(first, source, 'sys');
  });
}
