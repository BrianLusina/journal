import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { isRecording, readBaseline, writeBaseline } from '../lib/baseline';
import { newViolations } from '../lib/a11y';
import { SNAPSHOT_ARTICLE_PATH, STATIC_ROUTES } from './routes.data';

const BASELINE = 'blog-axe';
const ROUTES = [...STATIC_ROUTES, SNAPSHOT_ARTICLE_PATH];
type AxeBaseline = Record<string, string[]>;

async function analyze(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' });
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

  return violations;
}

test('@record record accessibility violations per route', async ({ page }) => {
  test.skip(!isRecording(), 'Only runs with E2E_RECORD=1');
  test.setTimeout(180_000);

  const baseline: AxeBaseline = {};
  for (const route of [...ROUTES].sort()) {
    baseline[route] = [...new Set((await analyze(page, route)).map(violation => violation.id))].sort();
  }

  writeBaseline(BASELINE, baseline);
});

const baseline = readBaseline<AxeBaseline>(BASELINE, {});

for (const route of isRecording() ? [] : ROUTES) {
  test(`@a11y ${route} has no new accessibility violations`, async ({ page }) => {
    const violations = await analyze(page, route);
    const added = newViolations(baseline[route] ?? [], violations.map(violation => violation.id));
    const details = violations
      .filter(violation => added.includes(violation.id))
      .map(violation => `${violation.id}: ${violation.help} (${violation.nodes[0]?.target.join(' ')})`);

    expect(details).toEqual([]);
  });
}
