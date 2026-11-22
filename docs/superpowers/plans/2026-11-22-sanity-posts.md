# Sanity posts source and Studio schema (P6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sanity as a third post source, behind a `sanity` flag that defaults off, so Sanity posts join the merged feed, search and slug lookup. Ship the Studio schema the posts are written in.

**Architecture:**
- `packages/cms/src/sanity/` follows the existing recipe ("Adding a content source" in `docs/ARCHITECTURE.md`):
  - `client.ts`: credentials and GROQ over `fetch`;
  - `map.ts`: the projection onto `UnifiedPost`, with the body converted from Portable Text to Markdown by `@portabletext/markdown`;
  - `source.ts`: the `CMSAdapter`.
- The blog gets the three `api/sanity/` routes and registers the source only while `features.sanity` is on.
- The post schema is plain data in `packages/cms/src/sanity/schema.ts`. The source and Studio share it, so the GROQ projection and Studio can't drift.
- Studio lives in `studio/` at the repo root, outside the bun workspace, with its own lockfile. Sanity Studio 6 needs React 19, and the blog is on React 18.

**Tech Stack:** GROQ over the Sanity HTTP API (no client SDK), `@portabletext/markdown` 2.9.2, Sanity Studio 6.22.0 with React 19.2.9, Vitest, Vercel functions.

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` (§6.1 Posts, §6.5 drafts, §6.7 freshness, §9 item 1). Issue #929 carries the scope.

## Global Constraints

- **Lockfile rule:** no `name@version` may leave the root `bun.lock`; new entries are fine. Check with the set diff used in P3–P5. The root lockfile must not gain any `react@19`, `sanity` or `styled-components` entry: Studio's dependencies live only in `studio/bun.lock`.
- **Versions:** each must be at least two weeks old. Pin exactly these:
  - `@portabletext/markdown` `2.9.2`;
  - `sanity` `6.22.0`;
  - `@sanity/code-input` `7.3.15`;
  - `react`/`react-dom` `19.2.9`;
  - `@types/react` `19.2.18`;
  - `styled-components` `6.6.0`;
  - `typescript` `5.8.3`.
- **Credentials:** they are server only and never `VITE_`-prefixed. The variables are:
  - `SANITY_PROJECT_ID`, required;
  - `SANITY_DATASET`, default `production`;
  - `SANITY_API_TOKEN`, a read token, required;
  - `SANITY_API_VERSION`, default `2025-02-19`.
- **Published content only:** every query sends `perspective=published`. Draft preview is P13 (#944).
- **Flag:** `sanity` defaults to `false` in `FEATURE_DEFAULTS`. While it is off, the blog never calls `/api/sanity`.
- **Blog unchanged:** with `sanity` off, the blog behaves as before, and its built CSS is byte-identical (the `cmp` check from P4/P5).
- **Importing `server.ts`:** it must not throw while Sanity isn't configured (`packages/cms/server.spec.ts`).

## Scope departures from #929 (each is a ruling, and goes in the ledger)

- **No revalidation webhook.** The blog's post routes are edge-cached for `s-maxage=60, stale-while-revalidate=300`, so a Sanity edit shows within about 6 minutes without one. `apps/sites` has no ISR yet and reads no posts. The revalidate endpoint is in P9's scope (roadmap), where something exists to revalidate.
- **Fixtures follow our projection.** No Sanity dataset exists yet. The GROQ projection in `client.ts` defines the response shape exactly, so the fixtures are written in that shape. Once Brian's dataset has a post, record one real response and swap it in (a follow-up line in the PR body).
- **`featured` is in the schema but not mapped.** §9 item 1 says Sanity's schema ships with its adapter, so the field exists now. `UnifiedPost` has no `featured` field until P10 adds it for every source.
- **Studio is checked in CI only by `tsc`.** `sanity build` needs a real project ID. Brian deploys Studio with `bunx sanity deploy` (out of repo).

## Review Focus

1. **The ESM-only converter in CommonJS functions.** `@portabletext/markdown` is `type: module`, and the blog's `api/` functions compile to CommonJS (`scripts/api-functions.spec.ts`). They load it through Node 22's `require(esm)`. If that fails, the Sanity routes crash on load (500, and not the `not configured` JSON) and `e2e/blog/api.spec.ts` fails on the preview. Task 3 checks it locally by requiring the package from CommonJS. It's the same class of bug as P5's `cookie` crash.
2. **A post with no `body`, an empty body, or body blocks of unknown types.** The slug route must answer the post, not 502. Unknown block types degrade, as the library documents. Task 1 pins empty and missing bodies, plus an unknown object type.
3. **Image blocks inside the body** need `asset->url` resolved in the projection, or they render as broken Markdown images. Task 1 pins an image block → `![alt](url)`.
4. **Tag and category filters with GROQ-special characters** (`"`, `\`, `*`). They must go as `$params`, never be interpolated into the query string. Task 2 pins that the query text never contains the tag value.
5. **Offset cursors:** a non-numeric or negative cursor is rejected, as Contentful does, so the route answers 400 and never runs a slice like `[NaN...]`. Task 2 pins it.

---

### Task 1: Schema contract and mapping

**Files:**
- Modify:
  - `packages/cms/src/types.ts` (`CMSSource` gains `'sanity'`);
  - `packages/cms/package.json` (dependency `@portabletext/markdown` `2.9.2`);
  - `apps/blog/src/services/cms/apiAdapter.ts` (`SOURCE_NAMES.sanity = 'Sanity'`). `SOURCE_NAMES` is a `Record<CMSSource, string>`, so the root typecheck needs it as soon as `CMSSource` grows.
- Create: `packages/cms/src/sanity/schema.ts`, `packages/cms/src/sanity/map.ts`, `packages/cms/src/sanity/__fixtures__.ts`
- Test: `packages/cms/src/sanity/schema.spec.ts`, `packages/cms/src/sanity/map.spec.ts`

**Interfaces:**
- Produces:
  - `postType` and `authorType`: plain Sanity document-type objects (`{ name, type: 'document', fields: [...] }`), with no import from `sanity`;
  - `POST_PROJECTION`, `SEARCH_PROJECTION`: GROQ projection strings;
  - `projectedFields(projection: string): string[]`;
  - `type SanityPost` (the projected shape);
  - `mapSanityPost(post: SanityPost): UnifiedPost`.

- [ ] **Step 1: Write the failing tests**
  - `schema.spec.ts`:
    - "declares every field the projections read": each name in `projectedFields(POST_PROJECTION)` and `projectedFields(SEARCH_PROJECTION)` is a field of `postType`.
    - "requires title, slug and publishDate": those fields carry a `validation` rule.
    - `postType` has these fields:
      - `title` (string);
      - `slug` (slug, `source: 'title'`);
      - `subtitle` (string);
      - `description` (text);
      - `category` (string);
      - `tags` (array of string, `layout: 'tags'`);
      - `authors` (array of reference to `author`);
      - `publishDate` (datetime);
      - `heroImage` (image, with an `alt` string field);
      - `thumbnail` (image, with `alt`);
      - `body` (array of `block`, `image` with `alt`, and `code`);
      - `featured` (boolean, `initialValue: false`).
    - `authorType` has `name` (string, required), `image` (image) and `shortBio` (text).
  - `map.spec.ts`, against fixtures in `__fixtures__.ts`:
    - A full post maps to:
      - `id` = `_id`, `source: 'sanity'`, `slug`, `title`, `subtitle`, `description`, `category`;
      - `publishDate` as given;
      - `tags`;
      - `authors` as `[{ id, source: 'sanity', name, avatarUrl, shortBio }]`;
      - `heroImage: { url, description: alt }`, and the same shape for `thumbnail`.
    - Optional fields that are missing or `null` become absent keys, not `null`s. Missing `tags` and `authors` give `[]`.
    - The body becomes Markdown:
      - a paragraph with `strong` → `**…**`;
      - an `h2` → `## …`;
      - a link markDef → `[text](href)`;
      - a `code` block `{ code: 'const a = 1', language: 'ts' }` → a fenced code block tagged `ts`;
      - an image block `{ alt: 'Diagram', url: 'https://cdn.sanity.io/images/p/d/x.png' }` → `![Diagram](https://cdn.sanity.io/images/p/d/x.png)`.
    - A `body` that is missing or `[]` → `body` absent. An unknown object type does not throw.
    - A search-projection post (no `body`) maps without a `body` key.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/cms test -- src/sanity`
  - Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**
  - `schema.ts`: the two objects above, with the `validation: (rule) => rule.required()` functions inline.
  - `POST_PROJECTION` reads:
    - `_id`, `title`, `"slug": slug.current`, `subtitle`, `description`, `category`, `publishDate`, `tags`;
    - `"authors": authors[]->{ _id, name, shortBio, "avatarUrl": image.asset->url }`;
    - `"heroImage": heroImage{ alt, "url": asset->url }`, and the same for `thumbnail`;
    - `"body": body[]{ ..., _type == "image" => { "alt": alt, "url": asset->url } }`.
  - `SEARCH_PROJECTION` is the same without `body` and `heroImage`.
  - `projectedFields` takes the top-level names: a quoted alias's source path root, or a bare name.
  - `mapSanityPost` calls `portableTextToMarkdown(body, { types: { image, code } })` with the two renderers the tests pin.

- [ ] **Step 4: Run the tests to verify they pass, then run the whole package**
  - Run: `bun run --filter @brianlusina/cms test` and `bun run typecheck`
  - Expected: PASS.

- [ ] **Step 5: Lockfile check, then commit**
  - Set diff of `name@version` before and after: nothing removed.
  - `git commit -m "feat(cms): Sanity post schema and mapping"` (Refs #929)

### Task 2: Client and source

**Files:**
- Create: `packages/cms/src/sanity/client.ts`, `packages/cms/src/sanity/source.ts`
- Modify: `packages/cms/server.ts` (export `sanitySource`, `isSanityConfigured`), `packages/cms/server.spec.ts`
- Test: `packages/cms/src/sanity/client.spec.ts`, `packages/cms/src/sanity/source.spec.ts`

**Interfaces:**
- Consumes: `POST_PROJECTION`, `SEARCH_PROJECTION`, `type SanityPost` and `mapSanityPost` from Task 1.
- Produces:
  - `isSanityConfigured(): boolean`;
  - `querySanity<T>(query: string, params: Record<string, unknown>): Promise<T>`;
  - `sanitySource: CMSAdapter`.

- [ ] **Step 1: Write the failing tests** (`fetch` mocked with `vi.stubGlobal`)
  - `client.spec.ts`:
    - `isSanityConfigured()` is false without `SANITY_PROJECT_ID` or `SANITY_API_TOKEN`, and true with both.
    - `querySanity('*[_type == $t]', { t: 'post' })` sends a GET to `https://<projectId>.api.sanity.io/v2025-02-19/data/query/production`. It carries:
      - `query` = the query text;
      - `$t` = `"post"` (JSON-encoded);
      - `perspective` = `published`;
      - `Authorization: Bearer <token>`.
    - It resolves to the response's `result`.
    - `SANITY_DATASET` and `SANITY_API_VERSION` override the defaults.
    - A non-2xx answer rejects with `Sanity query failed: <status>`.
  - `source.spec.ts` (with `querySanity` mocked):
    - `getPosts({ limit: 2 })` queries posts:
      - with `defined(slug.current) && defined(publishDate)`;
      - ordered by `publishDate desc`;
      - with the slice `[$start...$end]` and params `start: 0, end: 2`.
    - It returns `{ items, nextCursor: '2' }` when `total` is 5, and `nextCursor: null` when the page reaches `total`.
    - With `cursor: '2'`, `start` is 2.
    - `category` adds `category == $category`; `tag` adds `$tag in tags`. Neither value ever appears in the query text (Review Focus 4: tag `a" || true || "`).
    - A `cursor` of `'x'` or `'-1'` rejects with `Invalid cursor` without querying.
    - `getPostBySlug('hello')` queries with `slug.current == $slug` and the post projection, mapped. A `null` result gives `null`.
    - `getSearchIndex()` uses `SEARCH_PROJECTION` with the same listing filter and order, unsliced, and returns posts without `body`.
  - `server.spec.ts`: importing `server.ts` with no `SANITY_*` set doesn't throw, and `isSanityConfigured()` is false.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/cms test -- src/sanity server.spec`
  - Expected: FAIL, `client`/`source` not found.

- [ ] **Step 3: Implement** `client.ts`, `source.ts` and the exports
  - `config()` reads the env on each call, as Contentful's does.
  - `getPosts` sends one query, `{ "items": <filtered>[$start...$end]{POST_PROJECTION}, "total": count(<filtered>) }`, and the cursor is the offset of the next post.

- [ ] **Step 4: Run the tests to verify they pass**
  - Run: `bun run --filter @brianlusina/cms test:coverage` and `bun run --filter @brianlusina/cms typecheck`
  - Expected: PASS, coverage ≥ 85%.

- [ ] **Step 5: Commit** `feat(cms): Sanity source over GROQ, published content only` (Refs #929)

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
- Consumes: `sanitySource`, `isSanityConfigured` from `@brianlusina/cms/server` (Task 2).
- Produces: `GET /api/sanity/posts` → `{ results, nextCursor }`; `GET /api/sanity/posts/:slug` → `{ post }`; `GET /api/sanity/search-index` → `{ results }`. All three have the same statuses, headers and caching as the Notion routes.

- [ ] **Step 1: Write the failing tests**, copying the Notion route specs and changing the source:
  - The routes:
    - 500 `{ error: 'Sanity is not configured' }` from the posts and index routes;
    - 404 from the slug route while Sanity isn't configured;
    - 400 for an invalid cursor, from the source's `Invalid cursor`, as Contentful's posts route does;
    - 502 when the source throws;
    - `Cache-Control: s-maxage=60, stale-while-revalidate=300`;
    - `X-Search-Documents` on the index.
  - `adapters.spec.ts`: Sanity is registered only while `features.sanity` is on, after Contentful and Notion.
  - `features.spec.ts`: `sanity` defaults to `false`, and `parseFeatures('sanity=on').sanity` is `true`.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter blog test -- api/sanity src/services/cms src/config`
  - Expected: FAIL.

- [ ] **Step 3: Implement** the routes (HTTP only, through `api/_routes.ts`), the flag and the registry entry. Add `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` and `SANITY_API_VERSION` to `.env.sample` with comments, server-only like `NOTION_*`.

- [ ] **Step 4: Run the tests to verify they pass, then the root gates**
  - Run: `bun run test`, `bun run typecheck`, `bun run typecheck:api`, `bun run typecheck:server`, `bun run typecheck:e2e`, `bun run lint`
  - Expected: PASS.
  - `scripts/api-functions.spec.ts` (inside `bun run test`) covers the new functions' CommonJS emit.

- [ ] **Step 5: Check the converter loads from CommonJS (Review Focus 1)**
  - Run: `cd packages/cms && node -e "const m = require('@portabletext/markdown'); console.log(typeof m.portableTextToMarkdown)"`
  - Expected: `function`, with no `ERR_REQUIRE_ESM`.
  - Then: `bun apps/blog/server/build.ts` and `bun run --filter blog test -- server/index.spec`. Expected: the Docker server bundles and serves with the new routes.

- [ ] **Step 6: Commit** `feat(blog): Sanity routes behind the sanity flag (default off)` (Refs #929)

### Task 4: Studio

**Files:**
- Create in `studio/`:
  - `package.json`: name `studio`, private, `type: module`;
    - scripts `dev` (`sanity dev`), `build` (`sanity build`), `deploy` (`sanity deploy`), `typecheck` (`tsc --noEmit`);
    - the exact versions from Global Constraints;
  - `sanity.config.ts`, `sanity.cli.ts`, `tsconfig.json`, `bun.lock`, `.gitignore` (`node_modules`, `dist`, `.sanity`).
- Modify: `.github/workflows/lint.yml` (a `studio` job), `.github/dependabot.yml` (a `bun` entry for `/studio`), root `eslint.config.js` (ignore `studio/**`)

**Interfaces:**
- Consumes: `postType`, `authorType` from `packages/cms/src/sanity/schema.ts` (Task 1), imported by relative path `../packages/cms/src/sanity/schema`.

- [ ] **Step 1: Write the config files**
  - `sanity.config.ts`:
    - `defineConfig({ projectId: process.env.SANITY_STUDIO_PROJECT_ID!, dataset: process.env.SANITY_STUDIO_DATASET ?? 'production', plugins: [structureTool(), codeInput()], schema: { types: [postType, authorType] } })`.
  - `sanity.cli.ts`: the same project ID and dataset, from the same variables.

- [ ] **Step 2: Install and type-check (this is the failing gate first)**
  - Run: `cd studio && bun install && bun run typecheck`
  - Expected: the first run fails if the plain schema objects don't satisfy Sanity's `SchemaTypeDefinition`. Fix the objects in `schema.ts` (not with casts in Studio), until it passes.
  - Then run `bun run --filter @brianlusina/cms test` again. Expected: PASS.

- [ ] **Step 3: Check the root lockfile is untouched by Studio**
  - Run: `git diff --stat bun.lock`, then `grep -c '"sanity@\|"react@19\|styled-components@' bun.lock`
  - Expected: no change to the root lockfile from this task, and a count of `0`.

- [ ] **Step 4: CI and Dependabot**
  - `lint.yml` gets a job `studio`: checkout, setup-bun, `bun install --frozen-lockfile` and `bun run typecheck`, both with `working-directory: studio`.
  - Dependabot gets a second `bun` entry for `/studio`, with the same schedule and labels.

- [ ] **Step 5: Commit** `feat(studio): Sanity Studio with the post and author schema` (Refs #929)

### Task 5: Docs and final gates

**Files:** `docs/ARCHITECTURE.md`, `README.md`, `AGENTS.md` (one line), `docs/superpowers/plans/2026-11-12-sites-roadmap.md` (P6 status)

- [ ] **Step 1: Docs**
  - `ARCHITECTURE.md`, under Adapters, gets a `sanitySource` bullet:
    - GROQ over the HTTP API;
    - the published perspective;
    - offset cursors;
    - listing rules (`slug` and `publishDate` set);
    - Portable Text → Markdown (images and code blocks).
  - It also gets a "Sanity schema" table like the Notion one (field, Sanity type, used for, `UnifiedPost` field). It says to change `schema.ts`, `map.ts` and the table together.
  - Configuration gets the `SANITY_*` rows, and the Docker config list gets `SANITY_*`.
  - Feature flags get `sanity` (default off).
  - Source layout gets a `studio/` row: outside the workspace and why (React 19), deployed by `bun run deploy` in `studio/`.
  - Freshness: no webhook yet (about 6 minutes through the edge cache); the revalidate endpoint comes in P9.
  - `README.md` gets running Studio locally (`cd studio && bun install && bun run dev`, with `SANITY_STUDIO_PROJECT_ID`). `AGENTS.md` gets the `studio/` line.

- [ ] **Step 2: Final gates**
  - The root `test`, `test:coverage`, `typecheck`, `typecheck:api`, `typecheck:server`, `typecheck:e2e`, `lint` and `build` pass.
  - The blog CSS `cmp` is identical.
  - `bunx playwright test --project=lib` passes.
  - `studio` typecheck passes.
  - The lockfile set diff has nothing removed.
  - The journal preview E2E is green. It skips Sanity's `api.spec` case, because Sanity isn't configured, and that proves the route loads (Review Focus 1).

- [ ] **Step 3: Commit** `docs: describe the Sanity source and Studio` (Refs #929). Push. Ask Brian before opening the PR against `develop`.

## Out of repo (Brian), after merge

1. Create the Sanity project and the `production` dataset (private).
2. Create a read token (Viewer) and set `SANITY_PROJECT_ID` and `SANITY_API_TOKEN` (plus `SANITY_DATASET` if not `production`) on the `journal` Vercel project. Turn the flag on with `VITE_FEATURES=sanity=on`, on Preview first.
3. In `studio/`, deploy Studio with `SANITY_STUDIO_PROJECT_ID=<id> bun run deploy`. Add the blog's origins to the project's CORS list only if a browser ever queries Sanity (none does today).
4. Publish one post, then tell me, so a real response can replace the hand-written fixture.
