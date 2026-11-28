import { test, expect, isProductionHost } from './fixtures';

// Runs in both the home and folio projects, whose `use` sets the site. The banner only renders while
// the analytics flag is on (SITES_FEATURES or Edge Config), so this skips where it's off. On a
// production host, Google is blocked so a run never records a hit in the real GA property.
const GOOGLE = /googletagmanager\.com|google-analytics\.com/;

test.describe('@smoke consent', () => {
  test('makes no request to Google before consent; after it, only production asks for gtag.js', async ({ page, baseURL }) => {
    const production = isProductionHost(baseURL!);
    if (production) await page.route(GOOGLE, route => route.abort());
    const googleRequests: string[] = [];
    page.on('request', request => {
      if (GOOGLE.test(request.url())) googleRequests.push(request.url());
    });

    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Cookie consent' });
    // The island hydrates on idle; give it a moment before deciding the flag is off.
    await banner.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    test.skip(!(await banner.isVisible()), 'The analytics flag is off on this deployment');

    expect(googleRequests).toEqual([]);

    await page.getByRole('button', { name: 'Accept' }).click();
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => document.cookie)).toContain('consent=granted');

    // Analytics is production-only: anywhere else nothing loads from Google even after consent.
    await page.waitForLoadState('networkidle');
    if (production) expect(googleRequests.some(url => url.includes('googletagmanager.com/gtag/js'))).toBe(true);
    else expect(googleRequests).toEqual([]);
  });
});
