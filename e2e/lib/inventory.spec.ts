import http from 'http';
import type { AddressInfo } from 'net';
import { test, expect } from '@playwright/test';
import { missingPaths, readArticleEntry } from './inventory';

test('missingPaths ignores newly published posts', () => {
  expect(missingPaths(['/article/a/x'], ['/article/a/x', '/article/b/new'])).toEqual([]);
});

test('missingPaths reports posts that disappeared, in baseline order', () => {
  expect(missingPaths(['/article/a/x', '/article/b/y', '/article/c/z'], ['/article/b/y'])).toEqual([
    '/article/a/x',
    '/article/c/z',
  ]);
});

test.describe('readArticleEntry', () => {
  // A real local server, because a redirect faked with page.route isn't followed like a real one.
  let server: http.Server;
  let origin: string;

  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/article/gone/gone') {
        res.writeHead(302, { Location: '/404' });
        res.end();
        return;
      }
      const heading = req.url === '/404' ? '404' : 'A real article';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!doctype html><h1>${heading}</h1>`);
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  test.afterAll(() => {
    server.close();
  });

  test('reads the heading of an article that opens', async ({ page }) => {
    await page.goto(`${origin}/`);

    expect(await readArticleEntry(page, '/article/a/real')).toEqual({ path: '/article/a/real', h1: 'A real article' });
  });

  test('refuses an article that redirects, so it never becomes a baseline entry', async ({ page }) => {
    await page.goto(`${origin}/`);

    await expect(readArticleEntry(page, '/article/gone/gone')).rejects.toThrow(
      '/article/gone/gone redirected to /404 while recording',
    );
  });
});
