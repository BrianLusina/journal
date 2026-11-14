import { test, expect } from '../fixtures';
import { bypassHeadersFor } from '../lib/env';

// The blog project depends on this, so a wrong URL or a protected preview without the bypass
// secret gives this one failure instead of a failure per test. The title carries every tag so
// `--grep` filters keep it.
test('@smoke @visual @a11y @record the base URL serves the blog, not a login wall', async ({ request, baseURL }) => {
  // The fixture in ../fixtures throws before this runs when E2E_BASE_URL is unset.
  const url = baseURL!;
  const response = await request.get(url, {
    headers: bypassHeadersFor(url, url, process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
    maxRedirects: 0,
  });
  const status = response.status();
  const message = `Base URL returned ${status}. If this is a protected Vercel preview, set VERCEL_AUTOMATION_BYPASS_SECRET.`;

  expect(status, message).toBe(200);
  const body = await response.text();
  expect(body, message).toContain('<div id="root">');
  expect(body, `${url} is not the journal: its <title> isn't the blog's.`).toContain('<title>Journal');
});
