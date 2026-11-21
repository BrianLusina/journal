import { test, expect, isPreview } from '../sites/fixtures';
import { bypassHeadersFor } from '../lib/env';

test.use({ site: 'home' });

test.describe('@smoke home', () => {
  test('serves its page, known by its production URL', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Brian Lusina' })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://brianlusina.com/');
  });

  test('never serves its internal route prefix', async ({ request, baseURL }) => {
    const url = new URL('/home/', baseURL).toString();
    const response = await request.get(url, {
      headers: { ...bypassHeadersFor(url, baseURL!, process.env.VERCEL_AUTOMATION_BYPASS_SECRET), cookie: 'site=home' },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(404);
  });

  test('keeps crawlers out unless it is production', async ({ request, baseURL }) => {
    test.skip(!isPreview(baseURL!), 'Only previews are certain to be outside production.');
    const url = new URL('/robots.txt', baseURL).toString();
    const response = await request.get(url, {
      headers: { ...bypassHeadersFor(url, baseURL!, process.env.VERCEL_AUTOMATION_BYPASS_SECRET), cookie: 'site=home' },
      maxRedirects: 0,
    });

    expect(await response.text()).toBe('User-agent: *\nDisallow: /\n');
  });
});
