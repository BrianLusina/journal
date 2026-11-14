import { test, expect } from '../fixtures';
import { bypassHeadersFor } from '../lib/env';

test('@smoke the base URL serves the blog, not a login wall', async ({ request, baseURL }) => {
  // The fixture in ../fixtures throws before this runs when E2E_BASE_URL is unset.
  const url = baseURL!;
  const response = await request.get(url, {
    headers: bypassHeadersFor(url, url, process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
  });
  const status = response.status();
  const message = `Base URL returned ${status}. If this is a protected Vercel preview, set VERCEL_AUTOMATION_BYPASS_SECRET.`;

  expect(status, message).toBe(200);
  expect(await response.text(), message).toContain('<div id="root">');
});

test('@smoke home renders', async ({ page }) => {
  await page.goto('/');

  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible();
  await expect(heading).not.toHaveText('');
});
