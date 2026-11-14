import { test, expect } from '../fixtures';
import { bypassHeadersFor } from '../lib/env';
import { SNAPSHOT_ARTICLE_PATH, STATIC_ROUTES, UNKNOWN_ROUTE } from './routes.data';

const pathname = (url: string) => new URL(url).pathname;

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

for (const route of STATIC_ROUTES) {
  test(`@smoke ${route} renders`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });

    expect(pathname(page.url())).toBe(route);
    // Not every page has an h1 (/articles doesn't), so "renders" means real content and no 404.
    await expect(page.locator('main')).not.toHaveText(/^\s*$/);
    await expect(page.locator('h1', { hasText: /^404$/ })).toHaveCount(0);
  });
}

test('@smoke /authors shows its heading', async ({ page }) => {
  test.fail(true, 'Known defect BrianLusina/journal#946: Apollo queries Contentful with an empty space ID.');
  await page.goto('/authors', { waitUntil: 'networkidle' });

  await expect(page.locator('h1').first()).toBeVisible({ timeout: 5_000 });
});

test('@smoke an unknown route shows the 404 page', async ({ page }) => {
  await page.goto(UNKNOWN_ROUTE, { waitUntil: 'networkidle' });

  await expect(page.locator('h1').first()).toHaveText('404');
});

test('@smoke a missing article redirects to /404', async ({ page }) => {
  await page.goto('/article/missing/missing', { waitUntil: 'networkidle' });

  await expect(page).toHaveURL(/\/404$/);
  await expect(page.locator('h1').first()).toHaveText('404');
});

test('@smoke an article renders its heading', async ({ page }) => {
  await page.goto(SNAPSHOT_ARTICLE_PATH, { waitUntil: 'networkidle' });

  expect(pathname(page.url())).toBe(SNAPSHOT_ARTICLE_PATH);
  await expect(page.locator('h1').first()).not.toHaveText('');
});

test('@smoke a tag page lists posts', async ({ page }) => {
  await page.goto(SNAPSHOT_ARTICLE_PATH, { waitUntil: 'networkidle' });
  await page.locator('a[href^="/article/tag/"]').first().click();
  await page.waitForLoadState('networkidle');

  expect(pathname(page.url())).toMatch(/^\/article\/tag\//);
  // The tag page has no h1; it lists posts.
  await expect(page.locator('a[href^="/article/"]:not([href^="/article/tag/"])').first()).toBeVisible();
});

test('@smoke search follows its flag', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const searchEnabled = (await page.getByRole('button', { name: /search/i }).count()) > 0;

  await page.goto('/search', { waitUntil: 'networkidle' });
  await expect(page.locator('h1').first()).toHaveText(searchEnabled ? 'Search' : '404');
});
