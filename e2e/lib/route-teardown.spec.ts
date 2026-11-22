import http from 'http';
import type { AddressInfo } from 'net';
import { test as base, expect } from '@playwright/test';
import { routeWithBypass, unrouteBypass } from './bypass';

// A page that starts a slow first-party request after load, like an island's lazily imported
// script: the test can end while routeWithBypass is still fetching it.
let server: http.Server;
let baseURL: string;

base.beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/slow.js') {
      setTimeout(() => res.end('// slow'), 1500);
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>ready</h1><script>addEventListener("load", () => fetch("/slow.js"))</script>');
  });
  await new Promise<void>(resolve => server.listen(0, 'localhost', resolve));
  baseURL = `http://localhost:${(server.address() as AddressInfo).port}`;
});
base.afterAll(() => server.close());

const test = base.extend({
  page: async ({ page }, use) => {
    await routeWithBypass(page, baseURL, 's3cret');
    await use(page);
    await unrouteBypass(page);
  },
});

test('a request still in flight when the test ends is dropped, not reported as an error', async ({ page }) => {
  const slowRequest = page.waitForRequest(request => request.url().endsWith('/slow.js'));
  await page.goto(baseURL);
  await slowRequest;
  await expect(page.getByRole('heading', { name: 'ready' })).toBeVisible();
});
