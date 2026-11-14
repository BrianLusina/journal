import type { Page } from '@playwright/test';
import { bypassHeadersFor, isSameOrigin } from './env';

/**
 * Sends the Vercel bypass header on the deployment's own requests. A header added with
 * `route.continue` would stay on the request through a redirect to another origin, so each
 * request is fetched here without following redirects, and the redirect is handed back to the
 * browser. Its next request goes through this check again, so another origin never gets the secret.
 */
export async function routeWithBypass(page: Page, baseURL: string, secret: string): Promise<void> {
  await page.route(
    url => isSameOrigin(url.href, baseURL),
    async route => {
      const request = route.request();
      const response = await route.fetch({
        headers: { ...request.headers(), ...bypassHeadersFor(request.url(), baseURL, secret) },
        maxRedirects: 0,
      });
      await route.fulfill({ response });
    },
  );
}
