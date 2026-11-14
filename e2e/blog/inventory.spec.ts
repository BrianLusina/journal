import { test, expect } from '../fixtures';
import { isRecording, readBaseline, writeBaseline } from '../lib/baseline';
import { collectArticlePaths, missingPaths, type InventoryEntry } from '../lib/inventory';

const BASELINE = 'blog-articles';

test('@record record the article inventory', async ({ page }) => {
  test.skip(!isRecording(), 'Only runs with E2E_RECORD=1');
  test.setTimeout(300_000);

  const entries: InventoryEntry[] = [];
  for (const path of await collectArticlePaths(page)) {
    await page.goto(path, { waitUntil: 'networkidle' });
    entries.push({ path, h1: (await page.locator('h1').first().innerText()).trim() });
  }

  writeBaseline(BASELINE, entries.sort((a, b) => a.path.localeCompare(b.path)));
});

test('@smoke no recorded article has disappeared from /articles', async ({ page }) => {
  test.skip(isRecording(), 'Skipped while recording');
  test.setTimeout(120_000);
  const baseline = readBaseline<InventoryEntry[]>(BASELINE, []);
  expect(baseline.length, 'No baseline: run bun run e2e:record').toBeGreaterThan(0);

  expect(missingPaths(baseline.map(entry => entry.path), await collectArticlePaths(page))).toEqual([]);
});

for (const entry of isRecording() ? [] : readBaseline<InventoryEntry[]>(BASELINE, [])) {
  test(`@smoke ${entry.path} still opens with its heading`, async ({ page }) => {
    await page.goto(entry.path, { waitUntil: 'networkidle' });

    expect(new URL(page.url()).pathname, 'Redirected away, probably to /404').toBe(entry.path);
    await expect(page.locator('h1').first()).toHaveText(entry.h1);
  });
}
