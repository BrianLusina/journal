# Blog Parity Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Playwright suite that proves blog.brianlusina.com is unchanged on every Vercel preview, so the monorepo restructure (#926 onward) can't silently break the blog.

**Architecture:** Playwright lives at the repo root in `e2e/`, outside Vitest's `include` globs, so the two runners never collect each other's files. Pure helpers in `e2e/lib/` are unit-tested by a browserless `lib` project; browser tests in `e2e/blog/` form the `blog` project, which later plans extend with `home` and `folio`. Baselines (article inventory, axe rule ids) are JSON files recorded from a live deployment. Screenshots are generated in the same container CI uses. CI runs on Vercel's `deployment_status` event against the deployment's URL, plus a 30-minute production smoke.

**Tech Stack:** `@playwright/test` 1.65.0, `@axe-core/playwright` 4.14.0, bun 1.3.14, Node 22.16.0 (`.nvmrc`), GitHub Actions, container `mcr.microsoft.com/playwright:v1.65.0-noble`.

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` (§2 anti-goal 1, §7 quality gates, §8 uptime) · Issue #925 · Roadmap: `docs/superpowers/plans/2026-11-12-sites-roadmap.md`

## Global Constraints

- **No visible change to the blog.** The only files touched outside `e2e/`, CI, docs and config are `package.json`, `bun.lock`, `.gitignore` and `scripts/repo-policy.spec.ts`. No `src/` change.
- Pin exact versions: `@playwright/test@1.65.0`, `@axe-core/playwright@4.14.0` (devDependencies, no `^`). The CI container tag must match: `v1.65.0-noble`.
- bun only (`bun add -d`, `bun install --frozen-lockfile`); `bun.lock` is the only lockfile (the repo policy spec enforces this).
- Playwright files live under `e2e/` and are named `*.spec.ts`. Vitest's `include` (in `vitest.config.mts`) must never match `e2e/`.
- `E2E_BASE_URL` is the only way to choose the target. The `blog` project fails fast with a clear message when it's unset. There's no default URL.
- The Vercel bypass secret (`VERCEL_AUTOMATION_BYPASS_SECRET`) is sent **only** to the `E2E_BASE_URL` origin, never to third-party hosts.
- Traces off by default (`trace: 'off'`); screenshots only on failure.
- Test tags: `@smoke` (routes + inventory checks, used by the production schedule), `@visual`, `@a11y`. Recording tests carry `@record` and are skipped unless `E2E_RECORD=1`.
- Conventions from `AGENTS.md` apply (complete-sentence comments ending with a period; commit messages focused on impact).

## Review Focus

1. **The bypass secret leaking to third parties.** `extraHTTPHeaders` would send it to Contentful's CDN, Google, etc. Expected: only same-origin requests carry it. Pinned in Task 1 (`bypassHeadersFor` tests).
2. **A post published after the baseline was recorded.** Expected: extra posts are fine; only baseline posts that vanished or changed fail. Pinned in Task 3 (`missingPaths` tests).
3. **Third-party noise turning CI red:** blocked analytics, a Contentful image hiccup, or the deliberate console error on `/404`. Expected: only first-party failures and non-allowlisted first-party console errors fail a test. Pinned in Task 1 (`isRelevantConsoleError`, `isFirstPartyFailure` tests).
4. **"Load More" disables itself while loading and is removed when done** (observed on production). Expected: the crawl waits for it to be enabled, stops when it's gone, and throws after 20 rounds instead of hanging. Pinned in Task 3.
5. **A protected preview returning Vercel's login page.** Expected: one clear failure naming `VERCEL_AUTOMATION_BYPASS_SECRET`, not 40 confusing ones. Pinned in Task 1 (reachability test).

## File Structure

| File | Responsibility |
|---|---|
| `playwright.config.ts` | Projects `lib` and `blog`, reporters, snapshot path template |
| `e2e/tsconfig.json` | Type-checking for `e2e/` (`bun run typecheck:e2e`) |
| `e2e/lib/env.ts` | Base URL and bypass-header resolution |
| `e2e/lib/errors.ts` | Classifying console errors and failed requests |
| `e2e/lib/baseline.ts` | Reading/writing JSON baselines, recording switch |
| `e2e/lib/inventory.ts` | `missingPaths` (pure) and `collectArticlePaths` (browser) |
| `e2e/lib/a11y.ts` | `newViolations` (pure) |
| `e2e/lib/*.spec.ts` | Unit tests for the pure helpers |
| `e2e/fixtures.ts` | `test`/`expect` for browser tests: bypass routing + automatic page-error assertions |
| `e2e/blog/routes.data.ts` | Route lists shared by the smoke and a11y specs |
| `e2e/blog/routes.spec.ts` | Reachability + route smoke (`@smoke`) |
| `e2e/blog/inventory.spec.ts` | Article URL inventory (`@smoke`, `@record`) |
| `e2e/blog/visual.spec.ts` | Screenshots (`@visual`) |
| `e2e/blog/a11y.spec.ts` | axe baseline (`@a11y`, `@record`) |
| `e2e/baseline/blog-articles.json`, `e2e/baseline/blog-axe.json` | Recorded baselines (generated, committed) |
| `e2e/blog/__screenshots__/…` | Recorded screenshots (generated in CI, committed) |
| `.github/workflows/e2e.yml` | Suite on deployments, production smoke schedule, manual runs |
| `.github/workflows/e2e-update-baselines.yml` | PR label `update-baselines` → re-record and commit |

---

### Task 1: Harness, helpers and reachability check

**Files:**
- Modify: `package.json` (devDependencies, scripts), `bun.lock`, `.gitignore`, `scripts/repo-policy.spec.ts`, `.github/workflows/lint.yml`
- Create: `playwright.config.ts`, `e2e/tsconfig.json`, `e2e/lib/env.ts`, `e2e/lib/errors.ts`, `e2e/fixtures.ts`, `e2e/blog/routes.spec.ts`
- Test: `e2e/lib/env.spec.ts`, `e2e/lib/errors.spec.ts`, `scripts/repo-policy.spec.ts`

**Interfaces:**
- Produces (`e2e/lib/env.ts`):
  - `resolveBaseURL(env: NodeJS.ProcessEnv): string | undefined`: trimmed `E2E_BASE_URL` without a trailing slash, or `undefined`.
  - `bypassHeadersFor(requestUrl: string, baseURL: string, secret: string | undefined): Record<string, string>`: `{ 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' }` when `secret` is non-empty and `requestUrl` has the same origin as `baseURL`, else `{}`.
- Produces (`e2e/lib/errors.ts`):
  - `isFirstPartyFailure(requestUrl: string, baseURL: string): boolean`: same origin.
  - `isRelevantConsoleError(error: { text: string; sourceUrl: string; pathname: string }, baseURL: string): boolean`. False when `sourceUrl` is non-empty and third-party. False when allowlisted for that pathname. Otherwise true.
  - `CONSOLE_ALLOWLIST: ReadonlyArray<{ pathname: RegExp; text: RegExp }>`, initially two entries. Both use `pathname: /^\/(404|this-route-does-not-exist|article\/missing\/missing)$/` (the 404 page, and the deliberately missing article from Task 2, whose slug lookup returns 404 before the redirect). Their `text` patterns:
    - `/^404 Error: User attempted to access non-existent route/`;
    - `/status of 404/`.
- Produces (`e2e/fixtures.ts`): `test` and `expect`, where `test` extends Playwright's with:
  - `baseURL` asserted present (throws `E2E_BASE_URL is not set: point it at a blog deployment, e.g. E2E_BASE_URL=https://blog.brianlusina.com bun run e2e`);
  - a `page` whose same-origin requests get `bypassHeadersFor(...)` via `page.route`;
  - an auto fixture `pageErrors` that records relevant console errors (`msg.type() === 'error'`, `sourceUrl` from `msg.location().url`, current `pathname`) and first-party `requestfailed` and response status ≥ 500, then `expect`s both lists to be empty at teardown;
  - an opt-out `test.use({ allowPageErrors: true })` (boolean option, default `false`).

- [ ] **Step 1: Add dependencies and scripts.** `bun add -d -E @playwright/test@1.65.0 @axe-core/playwright@4.14.0`. Scripts:
  - `"e2e": "playwright test"`
  - `"e2e:record": "E2E_RECORD=1 playwright test --project=blog --grep @record"`
  - `"typecheck:e2e": "tsc -p e2e/tsconfig.json --noEmit"`

  `.gitignore` gains `test-results/`, `playwright-report/`, `blob-report/`.

- [ ] **Step 2: Write `playwright.config.ts`.**

```ts
import { defineConfig, devices } from '@playwright/test';
import { resolveBaseURL } from './e2e/lib/env';

export default defineConfig({
  testDir: 'e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: resolveBaseURL(process.env),
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  projects: [
    { name: 'lib', testDir: 'e2e/lib' },
    { name: 'blog', testDir: 'e2e/blog', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

  `e2e/tsconfig.json`: `strict: true`, `module`/`moduleResolution` `"ESNext"`/`"Bundler"`, `types: ["node"]`, `include: ["**/*.ts", "../playwright.config.ts"]`, `noEmit: true`. In `.github/workflows/lint.yml`, add a step `bun run typecheck:e2e` next to the existing `typecheck:api` step.

- [ ] **Step 3: Write the failing helper tests.** `e2e/lib/env.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { resolveBaseURL, bypassHeadersFor } from './env';

test('resolveBaseURL trims and drops the trailing slash', () => {
  expect(resolveBaseURL({ E2E_BASE_URL: ' https://x.vercel.app/ ' })).toBe('https://x.vercel.app');
  expect(resolveBaseURL({})).toBeUndefined();
  expect(resolveBaseURL({ E2E_BASE_URL: '' })).toBeUndefined();
});

test('bypassHeadersFor only targets the base origin', () => {
  const base = 'https://x.vercel.app';
  expect(bypassHeadersFor('https://x.vercel.app/api/notion/posts', base, 's3cret')).toEqual({
    'x-vercel-protection-bypass': 's3cret',
    'x-vercel-set-bypass-cookie': 'true',
  });
  expect(bypassHeadersFor('https://images.ctfassets.net/a.jpg', base, 's3cret')).toEqual({});
  expect(bypassHeadersFor('https://x.vercel.app.evil.com/', base, 's3cret')).toEqual({});
  expect(bypassHeadersFor('https://x.vercel.app/', base, undefined)).toEqual({});
  expect(bypassHeadersFor('https://x.vercel.app/', base, '')).toEqual({});
});
```

  `e2e/lib/errors.spec.ts` asserts:
  - `isFirstPartyFailure('https://b.com/api/x', 'https://b.com')` is true;
  - `isFirstPartyFailure('https://www.googletagmanager.com/gtag/js', 'https://b.com')` is false;
  - `isRelevantConsoleError` is false for `{ text: 'Failed to load resource: net::ERR_FAILED', sourceUrl: 'https://images.ctfassets.net/x.jpg', pathname: '/' }`;
  - false for `{ text: '404 Error: User attempted to access non-existent route: /404', sourceUrl: 'https://b.com/assets/index.js', pathname: '/404' }`;
  - **true** for that same text with `pathname: '/about'`;
  - true for `{ text: 'TypeError: x is undefined', sourceUrl: '', pathname: '/' }`.

- [ ] **Step 4: Run them to see them fail.** Run `bunx playwright test --project=lib`. Expected: FAIL, cannot find module `./env` / `./errors`.

- [ ] **Step 5: Implement `e2e/lib/env.ts` and `e2e/lib/errors.ts`** to the signatures above. Compare origins with `new URL(...).origin`; a URL that fails to parse is not first-party.

- [ ] **Step 6: Run the lib tests.** Run `bunx playwright test --project=lib`. Expected: PASS.

- [ ] **Step 7: Add the repo-policy test**, then run it. In `scripts/repo-policy.spec.ts`, add `describe('test runner isolation')` with: `it('keeps Vitest out of e2e/, which Playwright owns', …)`. It reads `vitest.config.mts` as text, extracts the quoted globs inside `include: [ … ]`, and asserts none starts with `e2e/` or `**`. It also asserts `playwright.config.ts` contains `testDir: 'e2e'`. Run `bun run test scripts/repo-policy.spec.ts`. Expected: PASS. (It passes against today's config; it exists to stop a future `**/*.spec.ts` glob.)

- [ ] **Step 8: Write `e2e/fixtures.ts`** to the interface above. Then add the first browser tests in `e2e/blog/routes.spec.ts`:
  - `test('@smoke the base URL serves the blog, not a login wall', …)` uses the `request` fixture with `bypassHeadersFor(baseURL, baseURL, process.env.VERCEL_AUTOMATION_BYPASS_SECRET)`. It expects status 200 and a body containing `<div id="root">`, with the failure message `Base URL returned ${status}. If this is a protected Vercel preview, set VERCEL_AUTOMATION_BYPASS_SECRET.`
  - `test('@smoke home renders', …)` goes to `/` and expects `page.locator('h1').first()` to be visible with non-empty text.

- [ ] **Step 9: Run against production.** Run `E2E_BASE_URL=https://blog.brianlusina.com bunx playwright test --project=blog`. Expected: 2 passed. Then run `bunx playwright test --project=blog` with `E2E_BASE_URL` unset. Expected: FAIL with the "E2E_BASE_URL is not set" message.

- [ ] **Step 10: Type-check and commit.** Run `bun run typecheck:e2e` (expected: no errors) and `bun run test` (expected: Vitest suite unchanged and green).

```bash
git add package.json bun.lock .gitignore playwright.config.ts e2e .github/workflows/lint.yml scripts/repo-policy.spec.ts
git commit -m "test(e2e): add Playwright harness that checks the blog without leaking the preview bypass secret"
```

### Task 2: Route smoke suite

**Files:**
- Create: `e2e/blog/routes.data.ts`
- Modify: `e2e/blog/routes.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect` from `e2e/fixtures.ts`.
- Produces (`e2e/blog/routes.data.ts`):
  - `STATIC_ROUTES: readonly string[] = ['/', '/articles', '/article', '/about', '/about-us', '/contact', '/contact-us', '/authors', '/privacy', '/terms']`;
  - `SNAPSHOT_ARTICLE_PATH = '/article/vomuFcNE5DD9sDzRrZ9if/perspective'` (a long-standing Contentful post; used by Tasks 4 and 5);
  - `UNKNOWN_ROUTE = '/this-route-does-not-exist'`.

- [ ] **Step 1: Write the smoke tests in `e2e/blog/routes.spec.ts`** (all tagged `@smoke`):
  - For each of `STATIC_ROUTES`, a test `` `@smoke ${route} renders` ``. Go to it and wait for `networkidle`. Expect `new URL(page.url()).pathname` to equal `route`, and the first `h1` to be visible with non-empty text.
  - `@smoke an unknown route shows the 404 page`: go to `UNKNOWN_ROUTE` and expect the `h1` to have text `404`.
  - `@smoke a missing article redirects to /404`: go to `/article/missing/missing` and expect pathname `/404` and `h1` `404`.
  - `@smoke an article renders its heading`: go to `SNAPSHOT_ARTICLE_PATH`, expect the pathname unchanged and the `h1` non-empty.
  - `@smoke a tag page lists posts`: from `SNAPSHOT_ARTICLE_PATH`, click the first `a[href^="/article/tag/"]`. Expect the pathname to start with `/article/tag/` and at least one `a[href^="/article/"]` link that isn't a tag link to be visible. The tag page has no `h1`.
  - `@smoke search follows its flag`: on `/`, if `page.getByRole('button', { name: /search/i })` has a count > 0, `/search` shows `h1` `Search`. Otherwise `/search` shows `h1` `404`.

- [ ] **Step 2: Run against production.** Run `E2E_BASE_URL=https://blog.brianlusina.com bunx playwright test --project=blog --grep @smoke`. Expected: all pass. If a route fails, check whether it's a real defect; report it to Brian, never weaken the assertion.

- [ ] **Step 3: Commit.**

```bash
git add e2e/blog
git commit -m "test(e2e): smoke-test every blog route, the 404 paths and the search flag"
```

### Task 3: Article URL inventory

**Files:**
- Create: `e2e/lib/baseline.ts`, `e2e/lib/inventory.ts`, `e2e/blog/inventory.spec.ts`, `e2e/baseline/blog-articles.json` (recorded)
- Test: `e2e/lib/inventory.spec.ts`

**Interfaces:**
- Produces (`e2e/lib/baseline.ts`):
  - `isRecording(env?: NodeJS.ProcessEnv): boolean` (`E2E_RECORD === '1'`);
  - `readBaseline<T>(name: string, fallback: T): T` (reads `e2e/baseline/<name>.json`, returns `fallback` if the file is missing);
  - `writeBaseline(name: string, data: unknown): void` (pretty JSON, 2 spaces, trailing newline, keys and arrays sorted by the caller).
- Produces (`e2e/lib/inventory.ts`):
  - `type InventoryEntry = { path: string; h1: string }`;
  - `missingPaths(baseline: readonly string[], crawled: readonly string[]): string[]` (baseline paths absent from `crawled`, in baseline order);
  - `collectArticlePaths(page: Page, maxRounds = 20): Promise<string[]>`. It loads `/articles`, then repeats while the `Load More` button is visible: wait for it to be enabled, click, then wait until the count of `a[href^="/article/"]` links grows or the button is gone. It throws `Pagination did not finish after ${maxRounds} rounds` if the cap is hit. It returns unique `href`s matching `^/article/[^/]+/[^/]+$` (excluding `/article/tag/…`), sorted.

- [ ] **Step 1: Write the failing unit tests** in `e2e/lib/inventory.spec.ts`:

```ts
test('missingPaths ignores newly published posts', () => {
  expect(missingPaths(['/article/a/x'], ['/article/a/x', '/article/b/new'])).toEqual([]);
});
test('missingPaths reports posts that disappeared, in baseline order', () => {
  expect(missingPaths(['/article/a/x', '/article/b/y', '/article/c/z'], ['/article/b/y'])).toEqual([
    '/article/a/x',
    '/article/c/z',
  ]);
});
```

- [ ] **Step 2: Run them to see them fail.** Run `bunx playwright test --project=lib e2e/lib/inventory.spec.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `e2e/lib/baseline.ts` and `e2e/lib/inventory.ts`** to the interfaces above.

- [ ] **Step 4: Run the unit tests.** Run `bunx playwright test --project=lib`. Expected: PASS.

- [ ] **Step 5: Write `e2e/blog/inventory.spec.ts`:**
  - `test('@record record the article inventory', …)` runs with `test.skip(!isRecording())` and `test.setTimeout(300_000)`. It calls `collectArticlePaths`, visits each path to read the first `h1`, and calls `writeBaseline('blog-articles', entries)` sorted by `path`.
  - `test('@smoke no recorded article has disappeared from /articles', …)` runs with `test.skip(isRecording())`. It reads the baseline (fallback `[]`), expects it to be non-empty with the message `No baseline: run bun run e2e:record`, and expects `missingPaths(baseline.map(e => e.path), await collectArticlePaths(page))` to equal `[]`.
  - Then, outside any test, `for (const entry of readBaseline<InventoryEntry[]>('blog-articles', []))` generates one test per entry: `` `@smoke ${entry.path} still opens with its heading` ``. Each goes to the path and expects the pathname to equal `entry.path` (not redirected to `/404`) and the first `h1` to have text `entry.h1`.

- [ ] **Step 6: Record against production.** Run `E2E_BASE_URL=https://blog.brianlusina.com bun run e2e:record`. Expected: 1 passed, and `e2e/baseline/blog-articles.json` has 46 entries as of 2026-11-12 (45 Contentful + 1 Notion). A count far from that means the crawl is wrong; investigate before committing.

- [ ] **Step 7: Verify.** Run `E2E_BASE_URL=https://blog.brianlusina.com bunx playwright test --project=blog e2e/blog/inventory.spec.ts`. Expected: 47 passed (1 crawl + 46 entries), 1 skipped.

- [ ] **Step 8: Commit.**

```bash
git add e2e/lib e2e/blog/inventory.spec.ts e2e/baseline/blog-articles.json
git commit -m "test(e2e): fail when a published article disappears or its heading changes"
```

### Task 4: Visual snapshots

**Files:**
- Create: `e2e/blog/visual.spec.ts`, `e2e/blog/__screenshots__/visual.spec.ts/*.png` (generated by CI in Task 6, not locally)

**Interfaces:**
- Consumes: `SNAPSHOT_ARTICLE_PATH` from `e2e/blog/routes.data.ts`; `test`, `expect` from `e2e/fixtures.ts`.

- [ ] **Step 1: Write `e2e/blog/visual.spec.ts`.** Combinations:
  - pages `{ name: 'home', path: '/' }`, `{ name: 'article', path: SNAPSHOT_ARTICLE_PATH }`, `{ name: 'about', path: '/about' }`;
  - viewports `{ width: 1440, height: 900 }` and `{ width: 390, height: 844 }`;
  - themes `light` and `dark`.

  That's 12 tests named `` `@visual ${name} ${theme} ${width}` ``. Each test:
  1. calls `page.addInitScript(t => localStorage.setItem('theme', t), theme)` before navigating (next-themes `storageKey="theme"`, `attribute="class"`);
  2. calls `page.setViewportSize(...)`, then `goto` with `waitUntil: 'networkidle'`, then `await page.evaluate(() => document.fonts.ready)`;
  3. runs `await expect(page).toHaveScreenshot(`${name}-${theme}-${width}.png`, { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.01, mask })`.

  `mask` is always `[page.locator('img'), page.locator('time')]`, plus `page.locator('#articles')` on home (the latest-posts list changes whenever a post is published).

  Add `test.skip(process.env.CI !== 'true', 'Screenshots are only compared in the CI container')`, so local runs on other OSes don't produce false diffs.

- [ ] **Step 2: Run locally to confirm the skip.** Run `E2E_BASE_URL=https://blog.brianlusina.com bunx playwright test --project=blog --grep @visual`. Expected: 12 skipped.

- [ ] **Step 3: Commit** (the screenshots arrive in Task 6).

```bash
git add e2e/blog/visual.spec.ts
git commit -m "test(e2e): add light/dark, desktop/mobile screenshots of home, an article and about"
```

### Task 5: Accessibility baseline

**Files:**
- Create: `e2e/lib/a11y.ts`, `e2e/blog/a11y.spec.ts`, `e2e/baseline/blog-axe.json` (recorded)
- Test: `e2e/lib/a11y.spec.ts`

**Interfaces:**
- Produces: `newViolations(baseline: readonly string[], actual: readonly string[]): string[]`: rule ids in `actual` but not in `baseline`, sorted, unique.
- Consumes: `STATIC_ROUTES`, `SNAPSHOT_ARTICLE_PATH`; `isRecording`, `readBaseline`, `writeBaseline`.

- [ ] **Step 1: Write the failing unit test** `e2e/lib/a11y.spec.ts`:

```ts
test('newViolations reports only rules missing from the baseline', () => {
  expect(newViolations(['color-contrast'], ['color-contrast', 'image-alt', 'image-alt'])).toEqual(['image-alt']);
  expect(newViolations(['color-contrast', 'region'], ['region'])).toEqual([]);
});
```

- [ ] **Step 2: Run it to see it fail.** Run `bunx playwright test --project=lib e2e/lib/a11y.spec.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `newViolations` in `e2e/lib/a11y.ts`,** then run `bunx playwright test --project=lib`. Expected: PASS.

- [ ] **Step 4: Write `e2e/blog/a11y.spec.ts`.**
  - Routes: `[...STATIC_ROUTES, SNAPSHOT_ARTICLE_PATH]`, light theme, desktop.
  - Each test runs `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()` and maps the violations to sorted unique rule ids.
  - When recording, one `@record` test collects every route's ids and writes `blog-axe.json` as `{ [route]: string[] }` with sorted keys.
  - Otherwise, one test per route, `` `@a11y ${route} has no new accessibility violations` ``, expects `newViolations(baseline[route] ?? [], ids)` to equal `[]`. On failure, print the offending violations' `help` and first `target`.

- [ ] **Step 5: Record and verify against production.** Run `E2E_BASE_URL=https://blog.brianlusina.com E2E_RECORD=1 bunx playwright test --project=blog e2e/blog/a11y.spec.ts`, then the same without `E2E_RECORD`. Expected: the baseline is written; then all `@a11y` tests pass. Tell Brian which rules the baseline contains; they're existing debt worth issues of their own.

- [ ] **Step 6: Commit.**

```bash
git add e2e/lib/a11y.ts e2e/lib/a11y.spec.ts e2e/blog/a11y.spec.ts e2e/baseline/blog-axe.json
git commit -m "test(e2e): fail on new accessibility violations on any blog route"
```

### Task 6: CI on deployments, production smoke, baseline updates, docs

**Files:**
- Create: `.github/workflows/e2e.yml`, `.github/workflows/e2e-update-baselines.yml`
- Modify: `docs/ARCHITECTURE.md` (Testing section), `README.md` (testing commands), `AGENTS.md` (Commands)

- [ ] **Step 1: Write `.github/workflows/e2e.yml`.**

```yaml
name: E2E

on:
  deployment_status:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:
    inputs:
      base_url:
        description: Deployment to test
        required: true
        default: https://blog.brianlusina.com

jobs:
  e2e:
    if: github.event_name != 'deployment_status' || github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    container: mcr.microsoft.com/playwright:v1.65.0-noble
    env:
      CI: 'true'
      E2E_BASE_URL: ${{ github.event.deployment_status.environment_url || github.event.deployment_status.target_url || inputs.base_url || 'https://blog.brianlusina.com' }}
      VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.deployment.sha || github.sha }}
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - name: Production smoke
        if: github.event_name == 'schedule'
        run: bunx playwright test --project=blog --grep @smoke
      - name: Full suite
        if: github.event_name != 'schedule'
        run: echo "Testing $E2E_BASE_URL" && bunx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 14
```

- [ ] **Step 2: Write `.github/workflows/e2e-update-baselines.yml`.**
  - Trigger: `pull_request: types: [labeled]`, with job condition `github.event.label.name == 'update-baselines'`. Same container. Permissions: `contents: write`, `deployments: read`, `pull-requests: write`.
  - Steps:
    1. Check out `github.head_ref`.
    2. Resolve the PR head SHA's Vercel deployment URL. Run `gh api "repos/${{ github.repository }}/deployments?sha=${{ github.event.pull_request.head.sha }}&per_page=1" --jq '.[0].statuses_url'`, then read the newest status's `environment_url`. Fail with "No Vercel deployment for this commit yet" if empty.
    3. `bun install --frozen-lockfile`.
    4. `E2E_RECORD=1 bunx playwright test --project=blog --grep @record`.
    5. `bunx playwright test --project=blog --grep @visual --update-snapshots`.
    6. Commit `e2e/baseline` and `e2e/blog/__screenshots__` as `github-actions[bot]` with message `test(e2e): update baselines from <url>`, and push.
    7. Remove the label (`gh pr edit --remove-label update-baselines`).

- [ ] **Step 3: Document.**
  - In `docs/ARCHITECTURE.md` → Testing, add an "End-to-end" bullet group covering: what each tag means; where baselines and screenshots live; that screenshots come only from CI; how to update (`update-baselines` label); the production schedule; `VERCEL_AUTOMATION_BYPASS_SECRET` (generated under Vercel → Project → Settings → Deployment Protection → Protection Bypass for Automation, stored as a GitHub Actions secret).
  - Add to `AGENTS.md` Commands and `README.md`: `E2E_BASE_URL=<url> bun run e2e`, `bun run e2e:record`, `bun run typecheck:e2e`.

- [ ] **Step 4: Commit, push, and open the PR.**

```bash
git add .github/workflows/e2e.yml .github/workflows/e2e-update-baselines.yml docs/ARCHITECTURE.md README.md AGENTS.md
git commit -m "ci(e2e): run the parity suite on every Vercel deployment and smoke production every 30 minutes"
```

  The PR body says `Closes #925` and lists the manual steps for Brian:
  - add the `VERCEL_AUTOMATION_BYPASS_SECRET` secret if previews are protected;
  - create the `update-baselines` label;
  - after merge, make the `E2E / e2e` check required on `develop` and `production`.

- [ ] **Step 5: Generate the screenshots.** Add the `update-baselines` label to the PR (needs the label to exist). Expected: the workflow commits 12 PNGs under `e2e/blog/__screenshots__/visual.spec.ts/` plus refreshed JSON baselines. Vercel redeploys the new commit, and `E2E` runs on the resulting `deployment_status`.

- [ ] **Step 6: Verify green.** Expected on the PR's preview deployment run: all `lib`, `@smoke`, `@visual` and `@a11y` tests pass. Check that the log line `Testing <url>` shows the preview URL, not the Vercel inspector. If it shows the inspector, swap the order of `environment_url` / `target_url` in `E2E_BASE_URL`. Then run the workflow manually (`workflow_dispatch`) after merge to confirm production is green.
