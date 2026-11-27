import { test, expect } from './fixtures';

// Runs in both the home and folio projects, whose `use` sets the site. The banner only renders while
// the analytics flag is on (SITES_FEATURES or Edge Config), so this skips where it's off.
const GOOGLE = /googletagmanager\.com|google-analytics\.com/;

test.describe('@smoke consent', () => {
  test('makes no request to Google before consent, and none on a preview after it', async ({ page }) => {
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

    // Analytics is production-only: a preview loads nothing from Google even after consent.
    await page.waitForLoadState('networkidle');
    expect(googleRequests).toEqual([]);
  });
});
