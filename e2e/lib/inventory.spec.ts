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
  const origin = 'http://journal.test';

  test.beforeEach(async ({ page }) => {
    await page.route(`${origin}/**`, route => {
      const { pathname } = new URL(route.request().url());
      if (pathname === '/article/gone/gone') {
        return route.fulfill({ status: 302, headers: { location: '/404' } });
      }
      const heading = pathname === '/404' ? '404' : 'A real article';
      return route.fulfill({ contentType: 'text/html', body: `<!doctype html><h1>${heading}</h1>` });
    });
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
