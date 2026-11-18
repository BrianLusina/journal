# packages/cms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the blog's post models, the per-source mapping, the source clients and the aggregator into a workspace package, `@brianlusina/cms`. The blog's `api/` routes then return `UnifiedPost`s, and `apps/sites` (Astro, P5) can read posts on the server with the same code.

**Architecture:** `packages/cms` has two entry files:
- `index.ts` is pure and isomorphic: the models, the `CMSAdapter` seam and the aggregator. The browser and the server both use it.
- `server.ts` is server-only: a Contentful source and a Notion source, each a `CMSAdapter` that queries the CMS directly.

The blog's routes call the server sources and return what they return. The two browser adapters, which differ only in their mapping, become one thin fetcher, `createApiAdapter(source)`. Astro will later call `createMergedFeed` over the server sources with no HTTP hop.

**Tech Stack:** bun 1.3.14 workspaces, TypeScript (strict), Vitest 3 with v8 coverage, `@notionhq/client` 5, `notion-to-md` 3, Vercel Functions (`@vercel/node`, compiled as CommonJS), the Docker server's `Bun.build`, Playwright 1.65 (`e2e/`).

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` (§2, §4, §6.1, §7) and issue #927 (the `packages/cms` half). The roadmap is `docs/superpowers/plans/2026-11-12-sites-roadmap.md`, row P3. `packages/ui` is P4, a separate plan.

## Global Constraints

- **blog.brianlusina.com changes in no way a reader could notice.** The blog parity suite (`e2e/`, project `blog`) stays green on the preview, and its baselines are not re-recorded.
- `packages/cms` has no browser globals and no `VITE_` variables. The credentials are `CONTENTFUL_CMS_*` and `NOTION_*`, read server-side only.
- Unit coverage ≥ 85% lines per package and app.
- bun is the only package manager. Dependencies are added with `bun add --cwd <workspace> <pkg>`, and the root `bun.lock` is committed.
- Current tool versions only; no tooling ported from the retired repos.
- Only the blog's own browser adapters and specs call the posts routes. This was checked on 2026-11-15: `e2e/` only matches on their URLs, and the old landing-page plan that called them is superseded. So their JSON shape is internal to the blog.
- Every route keeps its status codes, `Cache-Control` and `X-Search-Documents` behaviour. Only the JSON bodies change, to unified models.
- Out of scope: `featured` (P10 adds it once the CMS fields exist), Sanity (P6), `UnifiedProject` (P9), and `packages/ui` (P4).
- Pushes go to `claude/relaxed-brown-m6qnui` only. Never push to `staging` or `production`.

## Review Focus

1. **Server code leaking into the browser bundle.** If `index.ts` reaches anything under `src/contentful/` or `src/notion/client.ts`, the blog bundle gains `@notionhq/client` and the credential reads. The ESLint rule is added in Task 1; the bundle grep is in Task 4.
2. **A partial answer cached at the edge.** When Contentful's tag list fails, the posts route must answer without `Cache-Control`, as it does today. The source reports this as `partial: true`. The test is in Task 2.
3. **Importing `server.ts` with no CMS configured.** Astro imports it for every page, so it must not throw when `NOTION_*` and `CONTENTFUL_CMS_*` are unset, and both `is*Configured()` must return `false`. The test is in Task 3.
4. **An invalid cursor reaching the Contentful source directly.** Astro has no route to validate the cursor, so the source rejects a non-numeric one instead of sending `skip: NaN` to Contentful. The test is in Task 2.
5. **The route contract on the real host.** Each posts route returns `{ results: UnifiedPost[], nextCursor }` on the Vercel preview. Neither unit tests nor the visual suite check that. The e2e test is added in Task 1 and tightened in Tasks 2 and 3.

## Accepted risk (decide before Task 2 ships)

**Deploy skew.** A reader whose tab loaded the old JavaScript before a deploy will receive unified JSON from the new routes. The old bundle maps that JSON as raw Contentful or Notion data and fails. "Load more" and article navigation in that tab error until a reload; a fresh page load is unaffected. The alternative is to keep the raw routes beside new ones until old tabs age out, which is more code and two shapes to maintain. **Recommendation:** accept it, and merge outside reading peaks. Brian decides.

---

### Task 1: Scaffold `@brianlusina/cms`, move the pure core, prove the deploy path

The risk is front-loaded here. Nothing yet shows that a Vercel Function under `apps/blog/api` can load TypeScript source from a workspace package outside the Root Directory. `Bun.build` (Docker) and Vite resolve it without trouble. This task makes the first such import (`api/notion/*` → `NOTION_PROPERTY`) and proves it on the preview before anything else depends on it.

**Files:**
- Create:
  - `packages/cms/package.json`, `packages/cms/tsconfig.json`, `packages/cms/vitest.config.ts`
  - `packages/cms/index.ts`
  - `packages/cms/src/types.ts`, `packages/cms/src/adapter.ts`
  - `packages/cms/src/aggregator.ts` and `packages/cms/src/aggregator.spec.ts`, moved with `git mv` from `apps/blog/src/services/cms/aggregator{,.spec}.ts`
  - `packages/cms/src/notion/properties.ts`, moved with `git mv` from `apps/blog/shared/notion.ts`
  - `e2e/blog/api.spec.ts`
- Modify:
  - Root `package.json`: `workspaces`, and the `test`, `test:coverage` and `typecheck` scripts
  - `apps/blog/package.json`: add the dependency `"@brianlusina/cms": "workspace:*"`
  - `apps/blog/src/types/cms.d.ts`
  - `apps/blog/src/services/cms/{CMSAdapter,index,NotionAdapter}.ts`
  - `apps/blog/api/notion/{posts,search-index}.ts` and `apps/blog/api/notion/posts/[slug].ts`
  - `apps/blog/shared/tsconfig.json`, only if its comment names `notion.ts`
  - `eslint.config.js`

**Interfaces:**
- Produces, from `@brianlusina/cms` (`packages/cms/index.ts`):
  - the types `CMSSource`, `UnifiedAuthor`, `UnifiedAsset`, `UnifiedPost`, `CMSPostFilter`, `CMSPaginationOptions`, `PaginatedUnifiedPosts`, `CMSPageRequest` and `CMSPage`. They are exported versions of today's ambient types in `apps/blog/src/types/cms.d.ts`, plus one optional field: `CMSPage.partial?: true` ("the source answered without everything it should have; don't cache it");
  - `interface CMSAdapter`, today's interface unchanged;
  - `createMergedFeed(adapters: CMSAdapter[], filter?: CMSPostFilter): MergedFeed`, `findPostBySlug(adapters: CMSAdapter[], slug: string): Promise<UnifiedPost | null>`, and the types `MergedFeed` and `MergedPosts`, all moved unchanged;
  - `NOTION_PROPERTY`, `PUBLISHED_STATUS`, `publishedFilters` and `listedFilters`, moved unchanged. They're exported from the root entry only until Task 3.

- [ ] **Step 1: Package scaffold.**
  - `packages/cms/package.json`:
    - `name: "@brianlusina/cms"`, `private: true`, `main` and `types` set to `"index.ts"`;
    - no `exports` field, so `api/tsconfig.json`'s `moduleResolution: "node"` resolves `@brianlusina/cms/server` to `server.ts`;
    - no `"type"` field, so the package is CommonJS like `api/`;
    - scripts: `test` (`vitest run`), `test:coverage` (`vitest run --coverage`) and `typecheck` (`tsc --noEmit`).
  - `tsconfig.json`: strict, `target`/`lib` es2022, `types: ["node"]`, `module: "commonjs"`, `moduleResolution: "node"`, `noEmit`.
  - `vitest.config.ts`: `environment: 'node'`; `passWithNoTests: true`, removed in step 3 once the aggregator spec arrives; coverage on `src/**/*.ts` excluding specs; `thresholds: { lines: 85 }`.
- [ ] **Step 2: Workspace wiring.**
  - Root `workspaces`: `["apps/*", "packages/*"]`.
  - Root `test`, `test:coverage` and `typecheck` become `bun run --filter './packages/*' --filter './apps/*' <script>`. The other forwarding scripts stay blog-only.
  - Add `"@brianlusina/cms": "workspace:*"` to `apps/blog`'s dependencies, then run `bun install`.
  - Run `bun run test`. Expected: the output has both `@brianlusina/cms test:` and `blog test:` lines (the package has no specs yet, so `passWithNoTests: true` until step 3). If bun rejects two `--filter` flags, switch to `--filter '!brianlusina-sites'` and record that in the ledger.
- [ ] **Step 3: Move the core.**
  - `git mv` the aggregator and its spec into `packages/cms/src/`, then fix their imports.
  - Write `src/types.ts` (the types listed under Produces, `export type`) and `src/adapter.ts` (`CMSAdapter`).
  - Replace each `declare type X = …` in `apps/blog/src/types/cms.d.ts` with `declare type X = import('@brianlusina/cms').X;`. The file keeps no top-level import or export, so the names stay global and no consumer in `src/` changes.
  - `src/services/cms/CMSAdapter.ts` re-exports the package's `CMSAdapter` as its default export. `index.ts` takes `createMergedFeed`, `findPostBySlug`, `MergedFeed` and `MergedPosts` from the package.
- [ ] **Step 4: Move the Notion contract.**
  - `git mv apps/blog/shared/notion.ts packages/cms/src/notion/properties.ts`, and export its four names from `index.ts`. Update the doc comment: it is the contract between the routes and the mapping, and it stays constants-only.
  - Point `api/notion/*` and `src/services/cms/NotionAdapter.ts` at `@brianlusina/cms`. No `../shared/notion` import remains (`grep -rn "shared/notion" apps/blog` → no output).
- [ ] **Step 5: Keep the root entry pure.** In `eslint.config.js`, for `packages/cms/index.ts` and `packages/cms/src/{types,adapter,aggregator}.ts`, add `no-restricted-imports` with these patterns: `./contentful*`, `./notion/client*`, `./notion/source*`, `./contentful/**`, `@notionhq/*`, `notion-to-md`, and `node:*`.
  - Check the rule bites: temporarily add `import '@notionhq/client'` to `src/aggregator.ts` and run `bun run lint`. Expected: FAIL on that line. Revert it.
- [ ] **Step 6: Write the route contract test** in `e2e/blog/api.spec.ts`. It's one test per source, using Playwright's `request` with `bypassHeadersFor(url, baseURL, secret)` from `e2e/lib/env.ts`, the same way `e2e/blog/routes.spec.ts` gets its base URL and secret:
  ```ts
  test('GET /api/%s/posts?limit=1 answers a page of posts', ...) // for 'contentful' and 'notion'
  // status 200; body.results is an array; 'nextCursor' in body
  // Exception: a 500 whose JSON body is { error: '<Source> is not configured' } marks the test skipped
  // with that reason, so a preview without that source's variables isn't a failure. A crashed
  // function (FUNCTION_INVOCATION_FAILED, non-JSON body) still fails.
  ```
- [ ] **Step 7: Verify locally.** From the root, every one of these passes:
  - `bun run test`, `bun run test:coverage` (the package is ≥ 85%: it holds the aggregator and its spec)
  - `bun run typecheck`, `bun run typecheck:api`, `bun run typecheck:server`, `bun run typecheck:e2e`
  - `bun run lint`, `bun run build`
  - `bun apps/blog/server/build.ts`, then run `PORT=8090 bun apps/blog/dist-server/server/index.js` and `curl -s localhost:8090/api/notion/posts`. Expected: `{"error":"Notion is not configured"}`, which shows the bundled function loads the package. Stop the server.
- [ ] **Step 8: Commit** (`feat(cms): add @brianlusina/cms with the post models, aggregator and Notion contract`, body `Refs #927`).
- [ ] **Step 9: Deploy checkpoint (gate for Tasks 2–4).** Push.
  - Expected: the preview is Ready, and the E2E run on it is green, including `e2e/blog/api.spec.ts` for `notion` either passed or skipped as not configured, but not crashed.
  - **If a function crashes** with the module failing to load (`Cannot find module '@brianlusina/cms'`, `Unknown file extension ".ts"`, or a syntax error on `export`), use the fallback, and record the decision in the ledger and on #927:
    1. add a `build` script to the package: `tsc -p tsconfig.build.json`, emitting CommonJS and `.d.ts` to `dist/`;
    2. point `main`/`types` to `dist/index.js` and `dist/index.d.ts`, and add `server.js`/`server.d.ts` shims at the package root;
    3. add `"prebuild": "bun run --filter @brianlusina/cms build"` to `apps/blog`;
    4. gitignore `packages/cms/dist/`;
    5. push again until green.
  - Don't start Task 2 until this checkpoint is green.

### Task 2: Contentful server source; the Contentful routes return unified posts

**Files:**
- Create:
  - `packages/cms/src/contentful/client.ts`, moved with `git mv` from `apps/blog/api/contentful/_shared.ts`; its spec `_shared.spec.ts` moves to `client.spec.ts`
  - `packages/cms/src/contentful/map.ts` and `map.spec.ts`
  - `packages/cms/src/contentful/source.ts` and `source.spec.ts`
  - `packages/cms/server.ts`
  - `apps/blog/src/services/cms/apiAdapter.ts` and `apiAdapter.spec.ts`
- Modify:
  - `apps/blog/api/contentful/posts.ts`, `posts/[slug].ts` and `search-index.ts`, and their specs `_handlers.spec.ts` and `_searchIndex.spec.ts`
  - `apps/blog/src/services/cms/adapters.ts` and `index.ts`
  - `e2e/blog/api.spec.ts`
- Delete: `apps/blog/src/services/cms/ContentfulAdapter{,.spec}.ts`. Move its mapping cases to `map.spec.ts` first.

**Interfaces:**
- Consumes: `CMSAdapter`, `CMSPage`, `CMSPageRequest` and `UnifiedPost` from Task 1.
- Produces, from `@brianlusina/cms/server`:
  - `isContentfulConfigured(): boolean`, moved unchanged;
  - `contentfulSource: CMSAdapter`, with `source: 'contentful'`.
    - `getPosts` holds the query logic of today's `posts.ts` handler: `publishDate_exists`, the category filter, `tagFilters` with `getTagId`, and the cursor as an offset. It returns `partial: true` when the tag lookup failed.
    - `getPostBySlug` is today's slug handler, returning `null` for no match.
    - `getSearchIndex` is today's paged `GET_SEARCH_INDEX` loop, including its "empty page before the total" error.
- Produces, internal to the package: `mapContentfulPost(item: ContentfulPostItem): UnifiedPost`. That's today's `mapContentfulPostToUnified`, with `ContentfulPostItem` declared in `map.ts` as exactly the fields `POST_FIELDS` selects.
- Produces, in the blog: `createApiAdapter(source: CMSSource): CMSAdapter` (`src/services/cms/apiAdapter.ts`). It's the request and error handling of today's browser adapters, generalised over `/api/${source}/…`. It returns the payloads as they are: `{ items: results, nextCursor }`, `post` (or `null` on a 404), and `results`. The error messages keep today's wording, with the source name: "Unable to fetch Contentful posts: 502".

- [ ] **Step 1: Failing source tests** in `source.spec.ts`. Mock `fetch` the way `_handlers.spec.ts` does today.
  - `getPosts({ limit: 2 })`: queries `skip: 0` with `order: ['publishDate_DESC']`, and maps the items to `UnifiedPost`s. `nextCursor` is `'2'` when the total is above 2, and `null` at the end.
  - `getPosts({ limit: 2, tag: 'React' })`, when the tag REST call fails: still queries by legacy tag name; resolves with `partial: true`.
  - `getPosts({ limit: 2, cursor: 'abc' })`: rejects with `Error('Invalid cursor')`, and `fetch` is not called.
  - `getPostBySlug('missing')`: resolves `null`.
  - `getSearchIndex()`: reads 100 per page until it reaches the total, maps every item, and rejects on an empty page before the total.

  Run `bun run --filter @brianlusina/cms test`. Expected: FAIL (no `source.ts`).
- [ ] **Step 2: Implement** `client.ts` (moved), `map.ts` (moved mapping, tests carried over from `ContentfulAdapter.spec.ts`), `source.ts` and `server.ts` (`export { contentfulSource, isContentfulConfigured }`). Run the package tests. Expected: PASS.
- [ ] **Step 3: Thin the routes.**
  - Each route keeps its method check, its not-configured response (500 for lists, 404 for slug), the cursor regex (400), and its logging and 502.
  - Each route calls `contentfulSource` and answers `{ results: page.items, nextCursor: page.nextCursor }`, `{ post }` or `{ results }`.
  - `Cache-Control` is set unless `page.partial`.
  - Update `_handlers.spec.ts` and `_searchIndex.spec.ts`: the expected bodies become unified posts. Keep the test that a failed tag lookup leaves `Cache-Control` unset (Review Focus 2). Run `bun run test`. Expected: PASS.
- [ ] **Step 4: Browser.**
  - Write `apiAdapter.spec.ts`, covering `createApiAdapter('contentful')`: it builds the query string (limit, category, tag, cursor), answers `null` on a 404, rejects on any other non-OK status with the message above, and returns payloads unchanged. Run it. Expected: FAIL.
  - Implement it. In `adapters.ts`, `createApiAdapter('contentful')` replaces `new ContentfulAdapter()`. Delete `ContentfulAdapter{,.spec}.ts` and its export from `index.ts`.
  - Run `bun run test`. Expected: PASS.
- [ ] **Step 5: Tighten the contract test.** For `contentful`, also assert `results[0]` has string `id`, `slug`, `title` and `publishDate`, `source === 'contentful'`, array `tags`, and array `authors`, and has no `sys`.
- [ ] **Step 6: Verify** with the whole list from Task 1, Step 7, then commit (`feat(cms): read Contentful posts server-side; routes return unified posts`, `Refs #927`) and push. Expected: the preview is green, the parity suite is green, and `api.spec.ts` for `contentful` passes.

### Task 3: Notion server source; the Notion routes return unified posts

**Files:**
- Create:
  - `packages/cms/src/notion/client.ts`, moved with `git mv` from `apps/blog/api/notion/_shared.ts`; its spec `_shared.spec.ts` moves to `client.spec.ts`
  - `packages/cms/src/notion/map.ts` and `map.spec.ts`
  - `packages/cms/src/notion/source.ts` and `source.spec.ts`
  - `packages/cms/server.spec.ts`
- Modify:
  - `packages/cms/server.ts`, `packages/cms/index.ts` (drop the Notion constants from the root entry) and `packages/cms/package.json` (dependencies)
  - `apps/blog/api/notion/posts.ts`, `posts/[slug].ts` and `search-index.ts`, and their specs
  - `apps/blog/src/services/cms/adapters.ts` and `index.ts`
  - `apps/blog/package.json`
  - `e2e/blog/api.spec.ts`
- Delete: `apps/blog/src/services/cms/NotionAdapter{,.spec}.ts`. Move its mapping cases to `map.spec.ts` first.

**Interfaces:**
- Consumes: Task 1's types and Notion constants, and Task 2's `server.ts` and `createApiAdapter`.
- Produces, from `@brianlusina/cms/server`:
  - `isNotionConfigured(): boolean`, moved unchanged;
  - `notionSource: CMSAdapter`, with `source: 'notion'`.
    - `getPosts` is today's list query: `listedFilters`, the category filter, `isTagOption` (a tag that isn't an option resolves `{ items: [], nextCursor: null }`), `page_size: limit`, and `start_cursor`.
    - `getPostBySlug` is today's slug query plus `notion-to-md`; it returns the mapped post with `body` set, or `null`.
    - `getSearchIndex` is today's 100-per-page loop, including its "more without a cursor" error.
  - `NOTION_PROPERTY`, `PUBLISHED_STATUS`, `publishedFilters` and `listedFilters` are re-exported here instead of from the root entry.
- Produces, internal to the package: `mapNotionPage(page: NotionPage): UnifiedPost`. That's today's `mapNotionPageToUnified` with `plainText`, and `NotionPage` declared in `map.ts`.

- [ ] **Step 1: Failing tests.**
  - `source.spec.ts` mocks the Notion client module the way `api/notion/_handlers.spec.ts` does today:
    - `getPosts({ limit: 2, tag: 'NotAnOption' })` resolves `{ items: [], nextCursor: null }` with no query call.
    - `getPosts({ limit: 2 })` maps the pages and passes `has_more`/`next_cursor` through as `nextCursor`.
    - `getPostBySlug('perspective')` returns a post whose `body` is the Markdown from `notion-to-md`, and `null` when there are no results.
    - `getSearchIndex()` rejects when `has_more` comes without a `next_cursor`.
  - `server.spec.ts` (Review Focus 3): with `NOTION_API_KEY`, `NOTION_DATA_SOURCE_ID`, `NOTION_DATABASE_ID`, `CONTENTFUL_CMS_API_KEY` and `CONTENTFUL_CMS_SPACE_ID` deleted from `process.env`, do `vi.resetModules()`, then `await import('../server')`. It resolves, and `isNotionConfigured()` and `isContentfulConfigured()` are both `false`.

  Run the tests. Expected: FAIL.
- [ ] **Step 2: Implement.**
  - Move `client.ts`. Write `map.ts`, carrying over the tests from `NotionAdapter.spec.ts`, and `source.ts`. Extend `server.ts`.
  - Move `@notionhq/client` and `notion-to-md` to `packages/cms/package.json` with `bun remove --cwd apps/blog` and `bun add --cwd packages/cms`, at the same version ranges. Confirm nothing in `apps/blog` still imports them (`grep -rn "@notionhq\|notion-to-md" apps/blog/src apps/blog/api apps/blog/server` → no output).
  - Run the package tests. Expected: PASS.
- [ ] **Step 3: Thin the routes**, as in Task 2, Step 3. The Notion slug route now answers `{ post }`, with the body inside the post (it used to answer `{ page, body }`). Update the specs. Run `bun run test`. Expected: PASS.
- [ ] **Step 4: Browser.** In `adapters.ts`, `createApiAdapter('notion')` replaces `new NotionAdapter()`, keeping the `features.notion` guard. Delete `NotionAdapter{,.spec}.ts` and its export. Run `bun run test`. Expected: PASS.
- [ ] **Step 5: Tighten the contract test** for `notion` the same way as Task 2, Step 5, with `source === 'notion'` and no `properties` key.
- [ ] **Step 6: Verify** with the list from Task 1, Step 7, plus `bun install --frozen-lockfile` from a clean `node_modules`. Commit (`feat(cms): read Notion posts server-side; routes return unified posts`, `Refs #927`) and push. Expected: the preview and the parity suite are green.

### Task 4: Docs and final gates

**Files:**
- Modify: `docs/ARCHITECTURE.md` ("Overview" diagram labels, "Source layout", "The CMS seam" and its "Adapters", "Aggregator" and "Adding a content source" sections), `README.md` (the "Repository layout" paragraph), `AGENTS.md` (one line saying where content code lives)

- [ ] **Step 1: Docs.**
  - The seam now reads: source (`packages/cms/src/<source>/`: client, map and source) → route (`apps/blog/api/<source>/`: HTTP and caching only) → browser (`createApiAdapter`).
  - "Adding a content source" becomes:
    1. Add `packages/cms/src/<source>/{client,map,source}.ts` with specs, and export the source from `server.ts`.
    2. Add the three `apps/blog/api/<source>/` routes.
    3. List `createApiAdapter('<source>')` in `adapters.ts` (the browser).
    4. Add the source to `e2e/blog/api.spec.ts`.
  - Say that `apps/sites` will call `createMergedFeed` over the server sources directly. Replace the `shared/notion.ts` references with `packages/cms/src/notion/properties.ts`.
- [ ] **Step 2: Bundle check (Review Focus 1).** Run `bun run build`, then:

  ```bash
  grep -rlP "notionhq|notion-to-md|(?<!VITE_)CONTENTFUL_CMS_API_KEY|NOTION_API_KEY" apps/blog/dist
  ```

  Expected: no output. The lookbehind is there because the browser legitimately reads `VITE_CONTENTFUL_CMS_API_KEY` for authors, About and Social content. Then run `bun run check:bundle-size`. Expected: PASS with no budget change.
- [ ] **Step 3: Full verification.** From the root, everything passes:
  - all the checks in Task 1, Step 7;
  - `bun run lint:styles`, `bun run storybook:build`;
  - `bunx playwright test --project=lib --trace off`.
- [ ] **Step 4: Commit** (`docs: describe the cms package and the route contract`, `Refs #927`) and push.
- [ ] **Step 5: Parity gate.** The final preview is Ready, and its E2E run is green with `api.spec.ts` passing for each configured source. Ask Brian before opening the PR against `develop`.
