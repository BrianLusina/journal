import { test as base, expect } from '@playwright/test';
import { routeWithBypass } from './lib/bypass';
import { isExpectedFailure, isFirstPartyFailure, isRelevantConsoleError } from './lib/errors';

type Options = {
  /** Turns off the automatic console and request error check for one test or file. */
  allowPageErrors: boolean;
};

export type PageErrors = { consoleErrors: string[]; requestErrors: string[] };

type Fixtures = {
  /**
   * What the page reported: relevant console errors, uncaught exceptions and first-party request
   * failures. Unless `allowPageErrors` is set, the test fails at teardown if either list isn't empty.
   */
  pageErrors: PageErrors;
};

const BASE_URL_MISSING =
  'E2E_BASE_URL is not set: point it at a blog deployment, e.g. E2E_BASE_URL=https://blog.brianlusina.com bun run e2e';

export const test = base.extend<Options & Fixtures>({
  allowPageErrors: [false, { option: true }],

  baseURL: async ({ baseURL }, use) => {
    if (!baseURL) throw new Error(BASE_URL_MISSING);
    await use(baseURL);
  },

  page: async ({ page, baseURL }, use) => {
    const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    // Only the deployment's own requests carry the secret, and not through redirects; see routeWithBypass.
    if (secret && baseURL) await routeWithBypass(page, baseURL, secret);

    await use(page);
  },

  pageErrors: [
    async ({ page, baseURL, allowPageErrors }, use) => {
      const consoleErrors: string[] = [];
      const requestErrors: string[] = [];
      const pathname = () => new URL(page.url()).pathname;

      page.on('console', message => {
        if (message.type() !== 'error') return;
        const error = { text: message.text(), sourceUrl: message.location().url, pathname: pathname() };
        if (isRelevantConsoleError(error, baseURL!)) consoleErrors.push(`${error.pathname}: ${error.text}`);
      });
      // Uncaught exceptions and unhandled rejections arrive here, not on 'console'.
      page.on('pageerror', error => consoleErrors.push(`${pathname()}: uncaught ${error.name}: ${error.message}`));
      page.on('requestfailed', request => {
        // A request the page cancels (navigation, AbortController) is not a failure.
        if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
        if (isFirstPartyFailure(request.url(), baseURL!)) {
          requestErrors.push(`${request.url()}: ${request.failure()?.errorText}`);
        }
      });
      page.on('response', response => {
        if (
          response.status() >= 500 &&
          isFirstPartyFailure(response.url(), baseURL!) &&
          !isExpectedFailure(response.url(), response.status())
        ) {
          requestErrors.push(`${response.url()}: HTTP ${response.status()}`);
        }
      });

      await use({ consoleErrors, requestErrors });

      if (!allowPageErrors) {
        expect(consoleErrors, 'Console errors on the page').toEqual([]);
        expect(requestErrors, 'Failed requests to the deployment').toEqual([]);
      }
    },
    { auto: true },
  ],
});

export { expect };
