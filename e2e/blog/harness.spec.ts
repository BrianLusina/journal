import { test, expect } from '../fixtures';

// These check the harness itself: what the pageErrors fixture in ../fixtures records. The checks
// read the recorded lists directly, so an unrelated error on the page can't make them pass.
test.use({ allowPageErrors: true });

test('an uncaught exception in the page is recorded', async ({ page, pageErrors }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const thrown = page.waitForEvent('pageerror', error => error.message === 'Thrown on purpose by harness.spec.ts');

  await page.evaluate(() => setTimeout(() => {
    throw new Error('Thrown on purpose by harness.spec.ts');
  }));
  await thrown;

  expect(pageErrors.consoleErrors).toContain('/: uncaught Error: Thrown on purpose by harness.spec.ts');
});

test('a request the page cancels is not recorded', async ({ page, pageErrors }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const controller = new AbortController();
    const request = fetch('/api/notion/posts?limit=1', { signal: controller.signal }).catch(() => undefined);
    controller.abort();
    await request;
  });

  expect(pageErrors.requestErrors.filter(error => error.includes('/api/notion/posts?limit=1'))).toEqual([]);
});
