# Sanity posts source (P6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sanity as a third post source, behind a `sanity` flag that defaults off, so Sanity posts join the merged feed, search and slug lookup.

**Architecture:**
- **Prerequisite:** this plan starts from `develop` once #952 has merged. #952 adds Studio in `studio/`, at the repo root and outside the bun workspace, because it needs React 19. #952 also adds the `blogPost`, `author` and `tag` schema types and `ci_sanity_studio.yml`.
- **Studio schema:** P6 brings the schema in line with `UnifiedPost`.
- **Schema contract:** P6 commits the extracted schema as `studio/schema.json`. A `packages/cms` test checks the GROQ projection against it, so the adapter and Studio can't drift.
- **Source:** `packages/cms/src/sanity/` follows "Adding a content source" in `docs/ARCHITECTURE.md`:
  - `client.ts`: credentials, plus GROQ over `fetch` with a required read token;
  - `map.ts`: the projection onto `UnifiedPost`, body via `@portabletext/markdown`;
  - `source.ts`: the `CMSAdapter`.
- **Blog:** the blog gets the three `api/sanity/` routes and registers the source only while `features.sanity` is on.
- **Studio deploys:** they go only from `staging` (to the `staging` dataset) and `production` (to `production`). Every other branch only builds.

**Tech Stack:** GROQ over the Sanity HTTP API (no client SDK), `@portabletext/markdown` 2.9.2, Sanity Studio 6 (as #952 pins it) plus `@sanity/code-input` 7.3.15, Vitest, Vercel functions, GitHub Environments.

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` (§6.1 Posts, §6.5 drafts, §6.7 freshness, §9 item 1). Issue #929 carries the scope.

**Sanity project:** `Yggdrasil` (`7924v9hl`), with datasets `production` and `staging`. As of 2026-11-22 the only content is one untitled draft. The other project, `Lusina`, is Brian's to handle; nothing here reads or changes it.

## Global Constraints

- **Lockfile rule:** no `name@version` may leave the root `bun.lock`; new entries are fine. Check with the set diff used in P3–P5. Studio's dependencies stay in `studio/bun.lock`: the root lockfile must gain no `react@19`, `sanity` or `styled-components` entry.
- **Versions:** each must be at least two weeks old. `@portabletext/markdown` `2.9.2` (packages/cms) and `@sanity/code-input` `7.3.15` (studio). Studio's other versions stay as #952 set them.
- **Credentials:** they are server only and never `VITE_`-prefixed. The variables are:
  - `SANITY_PROJECT_ID`, required;
  - `SANITY_API_TOKEN`, a **required** Viewer token;
  - `SANITY_DATASET`, default `production`;
  - `SANITY_API_VERSION`, default `2025-02-19`.
- **Token required:** without the project ID and token, `isSanityConfigured()` is false, and the routes answer as for any unconfigured source. The token is only effective once Brian makes both datasets private (Out of repo, step 1). While a dataset is public, anyone can read its published documents without a token.
- **Published content only:** a Viewer token can read drafts, so every query sends `perspective=published`. That is the only thing standing between drafts and the public site. Draft preview is P13 (#944).
- **Assets:** images are public on Sanity's CDN even in a private dataset (by Sanity's design). Only images meant for the site belong in it.
- **Flag:** `sanity` defaults to `false` in `FEATURE_DEFAULTS`. While it is off, the blog never calls `/api/sanity`.
- **Blog unchanged:** with `sanity` off, the blog behaves as before, and its built CSS is byte-identical (the `cmp` check from P4/P5).
- **Importing `server.ts`:** it must not throw while Sanity isn't configured (`packages/cms/server.spec.ts`).

## Scope departures from #929 (each is a ruling, and goes in the ledger)

- **No revalidation webhook.** The blog's post routes are edge-cached for `s-maxage=60, stale-while-revalidate=300`, so an edit shows within about 6 minutes. `apps/sites` has no ISR yet and reads no posts. The revalidate endpoint is in P9's scope.
- **Fixtures follow our projection.** The datasets hold no published post, so fixtures are written in the shape our GROQ projection defines. Once one post is published, a real response replaces them (a follow-up in the PR body).
- **`featured` is in the schema but not mapped.** `UnifiedPost` gains `featured` in P10, for every source at once.

## Review Focus

1. **The ESM-only converter in CommonJS functions.** `@portabletext/markdown` is `type: module`, and the blog's `api/` functions compile to CommonJS. If Node 22's `require(esm)` fails, the Sanity routes crash on load, and the preview's `e2e/blog/api.spec.ts` fails. It's the same class of bug as P5's `cookie` crash. Task 3 checks it locally.
2. **Draft leakage.** A Viewer token sees `drafts.*` documents. If a query ever drops `perspective=published`, unpublished posts reach the site. Task 2 pins that every request carries it, the slug lookup included.
3. **Tag filters through references.** Tags are `tag` documents, so `?tag=` must match `$tag in tags[]->name`. A post whose tag reference is broken (the tag was deleted) must still map, with that tag left out. Task 1 pins it.
4. **GROQ-special characters in filters** (`"`, `\`, `*`) must go as `$params`, never be interpolated. Task 2 pins that the query text never contains the value.
5. **Offset cursors:** a non-numeric or negative cursor is rejected before any query, so the route answers 400. Task 2 pins it.

---

### Task 1: Studio schema, extracted contract and mapping

**Files:**
- Modify:
  - `studio/schemaTypes/blogPostType.ts`, `studio/schemaTypes/authorType.ts`;
  - `studio/sanity.config.ts` (add `codeInput()`);
  - `studio/package.json` (`@sanity/code-input` `7.3.15`; scripts `typecheck: tsc --noEmit` and `schema:extract: sanity schema extract --path schema.json`);
  - `packages/cms/src/types.ts` (`CMSSource` gains `'sanity'`);
  - `packages/cms/package.json` (`@portabletext/markdown` `2.9.2`);
  - `apps/blog/src/services/cms/apiAdapter.ts` (`SOURCE_NAMES.sanity = 'Sanity'`; `SOURCE_NAMES` is a `Record<CMSSource, string>`).
- Create: `studio/schema.json` (generated), `packages/cms/src/sanity/projection.ts`, `packages/cms/src/sanity/map.ts`, `packages/cms/src/sanity/__fixtures__.ts`
- Test: `packages/cms/src/sanity/projection.spec.ts`, `packages/cms/src/sanity/map.spec.ts`

**Interfaces:**
- Produces:
  - `POST_PROJECTION` and `SEARCH_PROJECTION` (GROQ projection strings);
  - `projectedFields(projection: string): string[]` (top-level source field names);
  - `type SanityPost`;
  - `mapSanityPost(post: SanityPost): UnifiedPost`.

- [ ] **Step 1: Change the Studio schema to the documented fields.** No published content exists, so renames cost nothing now.
  - `blogPost`:
    - `publishedAt` → `publishDate` (the `UnifiedPost` and Contentful name);
    - `description` → `text`;
    - `heroImage` and `thumbnail` gain an `alt` string field;
    - `body` becomes `[{ type: 'block' }, { type: 'image', fields: [alt] }, { type: 'code' }]`;
    - `featured` gets `initialValue: false`;
    - `tags` stays an array of references to `tag`.
  - `author`: `avatarUrl` (url) → `image` (image).
  - Run `cd studio && bun install && bun run typecheck && SANITY_STUDIO_PROJECT_ID=7924v9hl bun run schema:extract`.
  - Expected: it passes, and `studio/schema.json` is written.

- [ ] **Step 2: Write the failing tests**
  - `projection.spec.ts`:
    - "reads only fields the Studio schema declares": for each name in `projectedFields(POST_PROJECTION)` and `projectedFields(SEARCH_PROJECTION)`, the `blogPost` document in `studio/schema.json` has that field.
    - The test reads the JSON with `fs`, so `packages/cms` never imports `sanity`.
  - `map.spec.ts` (fixtures in `__fixtures__.ts`):
    - A full post maps to:
      - `id` = `_id`, `source: 'sanity'`;
      - `slug`, `title`, `subtitle`, `description`, `category`, `publishDate`;
      - `tags` as the tag names;
      - `authors` as `[{ id, source: 'sanity', name, avatarUrl, shortBio }]`;
      - `heroImage: { url, description: alt }`, and the same shape for `thumbnail`.
    - Missing or `null` optionals become absent keys. Missing `tags` and `authors` give `[]`. A `null` tag name, from a broken reference, is dropped (Review Focus 3).
    - The body becomes Markdown:
      - a `strong` span → `**…**`;
      - `h2` → `## …`;
      - a link markDef → `[text](href)`;
      - `{ _type: 'code', code: 'const a = 1', language: 'ts' }` → a fenced block tagged `ts`;
      - an image block `{ alt: 'Diagram', url: 'https://cdn.sanity.io/images/p/d/x.png' }` → `![Diagram](https://cdn.sanity.io/images/p/d/x.png)`.
    - A missing or `[]` body → no `body` key. An unknown object type doesn't throw.
    - A search-projection post maps without `body`.

- [ ] **Step 3: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/cms test -- src/sanity`
  - Expected: FAIL, modules not found.

- [ ] **Step 4: Implement**
  - `POST_PROJECTION` reads:
    - `_id`, `title`, `"slug": slug.current`, `subtitle`, `description`, `category`, `publishDate`;
    - `"tags": tags[]->name`;
    - `"authors": authors[]->{ _id, name, shortBio, "avatarUrl": image.asset->url }`;
    - `"heroImage": heroImage{ alt, "url": asset->url }`, and the same for `thumbnail`;
    - `"body": body[]{ ..., _type == "image" => { "alt": alt, "url": asset->url } }`.
  - `SEARCH_PROJECTION` is the same without `body` and `heroImage`.
  - `mapSanityPost` calls `portableTextToMarkdown(body, { types: { image, code } })` with the two renderers pinned above.

- [ ] **Step 5: Run the tests to verify they pass**
  - Run: `bun run --filter @brianlusina/cms test` and `bun run typecheck`
  - Expected: PASS.

- [ ] **Step 6: Lockfile check** (the set diff shows nothing removed), **then commit** `feat(cms): Sanity post mapping, against the extracted Studio schema` (Refs #929)

### Task 2: Client and source

**Files:**
- Create: `packages/cms/src/sanity/client.ts`, `packages/cms/src/sanity/source.ts`
- Modify: `packages/cms/server.ts` (export `sanitySource`, `isSanityConfigured`), `packages/cms/server.spec.ts`
- Test: `packages/cms/src/sanity/client.spec.ts`, `packages/cms/src/sanity/source.spec.ts`

**Interfaces:**
- Consumes: `POST_PROJECTION`, `SEARCH_PROJECTION`, `SanityPost` and `mapSanityPost` (Task 1).
- Produces:
  - `isSanityConfigured(): boolean`;
  - `querySanity<T>(query: string, params: Record<string, unknown>): Promise<T>`;
  - `sanitySource: CMSAdapter`.

- [ ] **Step 1: Write the failing tests** (`fetch` stubbed)
  - `client.spec.ts`:
    - `isSanityConfigured()` is false without `SANITY_PROJECT_ID`, false without `SANITY_API_TOKEN`, and true with both.
    - `querySanity('*[_type == $t]', { t: 'blogPost' })` sends a GET to `https://7924v9hl.api.sanity.io/v2025-02-19/data/query/production`. It carries:
      - `query`;
      - `$t` = `"blogPost"`, JSON-encoded;
      - `perspective=published`;
      - `Authorization: Bearer <token>`.
    - It resolves to the response's `result`.
    - `SANITY_DATASET` and `SANITY_API_VERSION` override the defaults.
    - A non-2xx answer rejects with `Sanity query failed: <status>`.
  - `source.spec.ts` (`querySanity` mocked):
    - `getPosts({ limit: 2 })` filters `_type == "blogPost" && defined(slug.current) && defined(publishDate)`, orders by `publishDate desc`, and slices `[$start...$end]` with `start: 0, end: 2`.
    - It answers `nextCursor: '2'` when `total` is 5, and `null` when the page reaches `total`.
    - With `cursor: '2'`, `start` is 2.
    - `category` adds `category == $category`; `tag` adds `$tag in tags[]->name`. Neither value appears in the query text; test with the tag `a" || true || "`.
    - A cursor of `'x'` or `'-1'` rejects with `Invalid cursor` before querying.
    - `getPostBySlug('hello')` matches `slug.current == $slug` (with the same listing filter), mapped. `null` gives `null`.
    - `getSearchIndex()` uses `SEARCH_PROJECTION` with the listing filter and order, unsliced.
    - Every `querySanity` call goes through the client, which always sends `perspective=published` (Review Focus 2). That is pinned in `client.spec.ts`. `source.spec.ts` asserts no call passes its own perspective.
  - `server.spec.ts`: importing with no `SANITY_*` set doesn't throw, and `isSanityConfigured()` is false.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/cms test -- src/sanity server.spec`
  - Expected: FAIL.

- [ ] **Step 3: Implement**
  - `config()` reads the env on each call, as Contentful's does.
  - `getPosts` sends one query: `{ "items": <filtered>[$start...$end]{POST_PROJECTION}, "total": count(<filtered>) }`.
  - The cursor is the offset of the next post.

- [ ] **Step 4: Run the tests to verify they pass**
  - Run: `bun run --filter @brianlusina/cms test:coverage` and `bun run --filter @brianlusina/cms typecheck`
  - Expected: PASS, coverage ≥ 85%.

- [ ] **Step 5: Commit** `feat(cms): Sanity source over GROQ, token required, published only` (Refs #929)

### Task 3: Blog routes, flag and registry

**Files:**
- Create: `apps/blog/api/sanity/posts.ts`, `apps/blog/api/sanity/posts/[slug].ts`, `apps/blog/api/sanity/search-index.ts`
- Modify:
  - `apps/blog/src/config/features.ts` (`sanity: false`);
  - `apps/blog/src/services/cms/adapters.ts`;
  - `e2e/blog/api.spec.ts` (`SOURCES` gains `{ source: 'sanity', name: 'Sanity', rawKey: '_id' }`);
  - `apps/blog/.env.sample`.
- Test: `apps/blog/api/sanity/_handlers.spec.ts`, `apps/blog/api/sanity/_searchIndex.spec.ts`, `apps/blog/src/services/cms/adapters.spec.ts`, `apps/blog/src/config/features.spec.ts`

**Interfaces:**
- Consumes: `sanitySource`, `isSanityConfigured` (Task 2).
- Produces: `GET /api/sanity/posts` → `{ results, nextCursor }`, `/api/sanity/posts/:slug` → `{ post }`, `/api/sanity/search-index` → `{ results }`. Statuses, headers and caching are the same as the Notion routes.

- [ ] **Step 1: Write the failing tests**, from the Notion route specs:
  - The routes:
    - 500 `{ error: 'Sanity is not configured' }` (posts and index);
    - 404 from the slug route when Sanity isn't configured;
    - 400 for `Invalid cursor`;
    - 502 when the source throws;
    - `Cache-Control: s-maxage=60, stale-while-revalidate=300`;
    - `X-Search-Documents` on the index.
  - `adapters.spec.ts`: Sanity is registered only while `features.sanity` is on, after Contentful and Notion.
  - `features.spec.ts`: `sanity` defaults to `false`, and `parseFeatures('sanity=on').sanity` is `true`.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter blog test -- api/sanity src/services/cms src/config`
  - Expected: FAIL.

- [ ] **Step 3: Implement** the routes (HTTP only, via `api/_routes.ts`), the flag and the registry entry. Add the four `SANITY_*` variables to `.env.sample`, server-only, with the Preview/Production dataset split noted.

- [ ] **Step 4: Run the tests to verify they pass, then the root gates**
  - Run: `bun run test`, `bun run typecheck`, `bun run typecheck:api`, `bun run typecheck:server`, `bun run typecheck:e2e`, `bun run lint`
  - Expected: PASS.

- [ ] **Step 5: Check the converter loads from CommonJS (Review Focus 1)**
  - Run: `cd packages/cms && node -e "console.log(typeof require('@portabletext/markdown').portableTextToMarkdown)"`
  - Expected: `function`.
  - Then `bun apps/blog/server/build.ts` and `bun run --filter blog test -- server/index.spec`. Expected: PASS.

- [ ] **Step 6: Commit** `feat(blog): Sanity routes behind the sanity flag (default off)` (Refs #929)

### Task 4: Studio CI: build everywhere, deploy only from staging and production

**Files:** `.github/workflows/ci_sanity_studio.yml`, `.github/dependabot.yml` (a `bun` entry for `/studio`)

- [ ] **Step 1: Rewrite the workflow**
  - Trigger: `push` (all branches), and `pull_request` on `studio/**` and the workflow file.
  - `build` job (every run):
    - install with `--frozen-lockfile`;
    - `bun run typecheck`;
    - `bun run build`;
    - `bun run schema:extract`, then `git diff --exit-code studio/schema.json`. It fails when the committed contract is stale, with a message to run `bun run schema:extract`.
    - It reads `SANITY_STUDIO_PROJECT_ID` from a repository variable. Project IDs aren't secret.
  - `deploy` job:
    - `needs: build`;
    - `if: github.event_name == 'push' && (github.ref_name == 'staging' || github.ref_name == 'production')`;
    - `environment: ${{ github.ref_name }}`, so each GitHub Environment holds its own `SANITY_STUDIO_DATASET` (variable), `SANITY_STUDIO_HOSTNAME`, `SANITY_STUDIO_APP_ID` and `SANITY_AUTH_TOKEN` (secrets);
    - `bun run deploy --url "$SANITY_STUDIO_HOSTNAME" --yes`. A hosted Studio's dataset is fixed at build time, so each branch deploys its own Studio to its own dataset, and `sanity deploy` uploads that branch's schema to that dataset.
  - `concurrency: studio-deploy-${{ github.ref_name }}`, without cancel-in-progress, so two pushes never deploy at once.

- [ ] **Step 2: Verify**
  - Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci_sanity_studio.yml'))"`. Expected: no error.
  - Then check the deploy condition by reading the YAML: the `deploy` job has the `if` above and the `environment` key.
  - Then push this branch. Expected: the workflow runs `build` and skips `deploy`.

- [ ] **Step 3: Commit** `ci(studio): build on every branch; deploy only staging and production` (Refs #929)

### Task 5: Docs and final gates

**Files:** `docs/ARCHITECTURE.md`, `README.md`, `AGENTS.md` (one line), `studio/README.md` (replace the template text), `docs/superpowers/plans/2026-11-12-sites-roadmap.md` (P6 status)

- [ ] **Step 1: Docs**
  - `ARCHITECTURE.md` gets a `sanitySource` bullet under Adapters:
    - GROQ over the HTTP API;
    - token required, private datasets;
    - published perspective, and why it matters with a Viewer token;
    - offset cursors;
    - listing rules (`slug` and `publishDate` set);
    - tags through references;
    - Portable Text → Markdown.
  - It also gets a "Sanity schema" table like the Notion one. It says to change `studio/schemaTypes/*`, `studio/schema.json` (`bun run schema:extract`), `projection.ts`, `map.ts` and the table together.
  - Configuration gets the `SANITY_*` rows: Vercel Preview reads `staging`, Production reads `production`. The Docker list gets `SANITY_*`, and Feature flags get `sanity`.
  - Source layout gets a `studio/` row, and Deployment gets the Studio deploy rule.
  - Freshness: no webhook yet; the revalidate endpoint comes in P9.
  - `studio/README.md`: run locally (`make sanity.run.studio.dev`), regenerate `schema.json`, and how deploys work.
  - `AGENTS.md` gets the `studio/` line.

- [ ] **Step 2: Final gates**
  - The root `test`, `test:coverage`, `typecheck`, `typecheck:api`, `typecheck:server`, `typecheck:e2e`, `lint` and `build` pass.
  - The blog CSS `cmp` is identical.
  - `bunx playwright test --project=lib` passes.
  - Studio `typecheck`, `build` and the `schema.json` check pass.
  - The lockfile set diff has nothing removed.
  - The journal preview E2E is green. The Sanity case is skipped while it isn't configured, and that proves the route loads.

- [ ] **Step 3: Commit** `docs: describe the Sanity source and Studio deploys` (Refs #929). Push. Ask Brian before opening the PR against `develop`.

## Out of repo (Brian)

1. Make both datasets private. Without this, the required token protects nothing:
   ```bash
   cd studio && bunx sanity dataset visibility set production private
   ```
   ```bash
   cd studio && bunx sanity dataset visibility set staging private
   ```
2. Create a **Viewer** API token (not Editor). On the `journal` Vercel project, set:
   - `SANITY_PROJECT_ID=7924v9hl` and `SANITY_API_TOKEN`;
   - `SANITY_DATASET=staging` for Preview and `production` for Production.
3. In GitHub:
   - a repository variable `SANITY_STUDIO_PROJECT_ID=7924v9hl`;
   - Environments `staging` and `production`, each with the variable `SANITY_STUDIO_DATASET` (the branch name) and the secrets `STUDIO_DEPLOY_APP_ID`, `STUDIO_DEPLOY_HOSTNAME` and `STUDIO_DEPLOY_TOKEN` (a deploy token);
   - delete the repository-level `SANITY_STUDIO_APP_ID`, `SANITY_STUDIO_HOSTNAME` and `SANITY_AUTH_TOKEN`, which nothing reads any more (final review, Important #1).
   - Each Environment's hostname and app ID must be its own Studio. The `production` Environment can reuse the existing one.
4. Turn the flag on with `VITE_FEATURES=sanity=on`, on Preview first. Publish one post, so a recorded response can replace the hand-written fixture.
