import { test, expect } from '../fixtures';

// These check the harness itself: what the automatic page-error check in ../fixtures counts.

test('an uncaught exception in the page fails the test', async ({ page }) => {
  test.fail(true, 'The pageErrors fixture must report the exception thrown below.');
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => setTimeout(() => {
    throw new Error('Thrown on purpose by harness.spec.ts');
  }));
  await page.waitForTimeout(200);
});

test('a request the page cancels is not a failure', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const controller = new AbortController();
    const request = fetch('/api/notion/posts?limit=1', { signal: controller.signal }).catch(() => undefined);
    controller.abort();
    await request;
  });
  await expect(page.locator('h1').first()).toBeVisible();
});
