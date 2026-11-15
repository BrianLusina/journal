import http from 'http';
import type { AddressInfo } from 'net';
import { test, expect } from '@playwright/test';
import { routeWithBypass } from './bypass';

type Seen = { server: 'deployment' | 'elsewhere'; path: string; secret: string | null };

// Two local servers on different origins: the "deployment" redirects to "elsewhere".
async function startServers(seen: Seen[]) {
  const elsewhere = http.createServer((req, res) => {
    seen.push({ server: 'elsewhere', path: req.url ?? '', secret: (req.headers['x-vercel-protection-bypass'] as string) ?? null });
    res.end('<html><body>elsewhere</body></html>');
  });
  await new Promise<void>(resolve => elsewhere.listen(0, '127.0.0.1', resolve));
  const elsewhereURL = `http://127.0.0.1:${(elsewhere.address() as AddressInfo).port}`;

  const deployment = http.createServer((req, res) => {
    seen.push({ server: 'deployment', path: req.url ?? '', secret: (req.headers['x-vercel-protection-bypass'] as string) ?? null });
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: `${elsewhereURL}/landed` });
      res.end();
      return;
    }
    res.end('<html><body>deployment</body></html>');
  });
  await new Promise<void>(resolve => deployment.listen(0, 'localhost', resolve));
  const deploymentURL = `http://localhost:${(deployment.address() as AddressInfo).port}`;

  return { deploymentURL, close: () => { deployment.close(); elsewhere.close(); } };
}

test('the bypass secret reaches the deployment but never follows a redirect to another origin', async ({ page }) => {
  const seen: Seen[] = [];
  const { deploymentURL, close } = await startServers(seen);

  try {
    await routeWithBypass(page, deploymentURL, 's3cret');
    await page.goto(`${deploymentURL}/redirect`);

    expect(new URL(page.url()).pathname).toBe('/landed');
    expect(seen.find(request => request.server === 'deployment')?.secret).toBe('s3cret');
    expect(seen.filter(request => request.server === 'elsewhere').map(request => request.secret)).toEqual([null]);
  } finally {
    close();
  }
});
