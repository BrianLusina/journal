import type { Page } from '@playwright/test';

export type InventoryEntry = { path: string; h1: string };

/** Baseline paths missing from `crawled`, in baseline order. Posts published since are fine. */
export function missingPaths(baseline: readonly string[], crawled: readonly string[]): string[] {
  const present = new Set(crawled);

  return baseline.filter(path => !present.has(path));
}

const ARTICLE_LINKS = 'a[href^="/article/"]';
const ARTICLE_PATH = /^\/article\/(?!tag\/)[^/]+\/[^/]+$/;

/**
 * Every article path listed on /articles. "Load More" disables itself while loading and is
 * removed once everything is shown, so each round waits for it to be enabled, clicks, then waits
 * for more links or for the button to go.
 */
export async function collectArticlePaths(page: Page, maxRounds = 20): Promise<string[]> {
  await page.goto('/articles', { waitUntil: 'networkidle' });
  const loadMore = page.getByRole('button', { name: 'Load More' });

  for (let round = 0; await loadMore.isVisible(); round++) {
    if (round >= maxRounds) throw new Error(`Pagination did not finish after ${maxRounds} rounds`);

    const before = await page.locator(ARTICLE_LINKS).count();
    await loadMore.click();
    await page.waitForFunction(
      ([selector, count]) =>
        document.querySelectorAll(selector).length > count ||
        ![...document.querySelectorAll('button')].some(button => button.textContent?.trim() === 'Load More'),
      [ARTICLE_LINKS, before] as const,
      { timeout: 20_000 },
    );
  }

  const hrefs = await page.locator(ARTICLE_LINKS).evaluateAll(links => links.map(link => link.getAttribute('href') ?? ''));

  return [...new Set(hrefs.filter(href => ARTICLE_PATH.test(href)))].sort();
}

/**
 * Opens `path` (relative to the page's current site) and returns its first heading. Throws when
 * the article redirects (to /404, say), so a broken article fails the recording instead of being
 * written into the baseline under its old path.
 */
export async function readArticleEntry(page: Page, path: string): Promise<InventoryEntry> {
  await page.goto(new URL(path, page.url()).href, { waitUntil: 'networkidle' });
  const landed = new URL(page.url()).pathname;
  if (landed !== path) throw new Error(`${path} redirected to ${landed} while recording`);

  return { path, h1: (await page.locator('h1').first().innerText()).trim() };
}
