import { test, expect } from '../fixtures';

// These check the harness itself: what the pageErrors fixture in ../fixtures records. They serve a
// synthetic page at the deployment's own origin, so they don't depend on the live site, and they
// read the recorded lists directly, so an unrelated error can't make them pass.
test.use({ allowPageErrors: true });

const HARNESS_PAGE = '/__harness';

test.beforeEach(async ({ page }) => {
  await page.route(`**${HARNESS_PAGE}`, route =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><h1>harness</h1></body></html>' }),
  );
  // Answers late, so the page can cancel the request before it completes.
  await page.route('**/__harness-slow', route =>
    new Promise(resolve => setTimeout(resolve, 2_000)).then(() => route.fulfill({ body: '' }).catch(() => undefined)),
  );
});

test('an uncaught exception in the page is recorded', async ({ page, pageErrors }) => {
  await page.goto(HARNESS_PAGE);
  const thrown = page.waitForEvent('pageerror', error => error.message === 'Thrown on purpose by harness.spec.ts');

  await page.evaluate(() => setTimeout(() => {
    throw new Error('Thrown on purpose by harness.spec.ts');
  }));
  await thrown;

  expect(pageErrors.consoleErrors).toContain(`${HARNESS_PAGE}: uncaught Error: Thrown on purpose by harness.spec.ts`);
});

test('a request the page cancels is not recorded', async ({ page, pageErrors }) => {
  await page.goto(HARNESS_PAGE);
  const failed = page.waitForEvent('requestfailed', request => request.url().endsWith('/__harness-slow'));

  await page.evaluate(() => {
    const controller = new AbortController();
    fetch('/__harness-slow', { signal: controller.signal }).catch(() => undefined);
    controller.abort();
  });
  expect((await failed).failure()?.errorText).toBe('net::ERR_ABORTED');

  expect(pageErrors.requestErrors).toEqual([]);
});
