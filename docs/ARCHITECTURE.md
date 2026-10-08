# Architecture

This document describes how the journal site is put together: where content comes from, how it flows to the page, and the decisions and known limits behind that design. For setup and commands, see the [README](../README.md).

## Overview

The site is a client-rendered React 18 single-page app built with Vite. Posts can come from more than one content management system (CMS): today **Contentful** (GraphQL, called from the browser) and **Notion** (called through serverless functions, because a Notion API key must never reach the browser).

```text
                   Browser (React SPA)                              Server (Vercel Functions)
┌──────────────────────────────────────────────────────────┐     ┌──────────────────────────────┐
│ pages/ & features/                                       │     │ api/notion/posts.ts          │
│   │ usePosts / usePost (hooks/cms)                       │     │ api/notion/posts/[slug].ts   │
│   ▼                                                      │     │   │ @notionhq/client         │
│ services/cms/aggregator ── merge, sort, page, find       │     │   │ notion-to-md (body)      │
│   │ over cmsAdapters (services/cms/adapters)             │     │   ▼                          │
│   ├── ContentfulAdapter ── Apollo ─────────────────────────────▶ Contentful GraphQL API       │
│   └── NotionAdapter ───── fetch('/api/notion/…') ──────────────▶ Notion API                   │
│                                                          │     └──────────────────────────────┘
│ Contentful-only content (authors, about, social):        │
│   hooks/api/* and features ── Apollo useQuery ─────────────────▶ Contentful GraphQL API
└──────────────────────────────────────────────────────────┘
```

## Source layout

| Path | Responsibility |
|---|---|
| `src/main.tsx` | Entry point. Mounts the provider tree: Apollo (Contentful client), TanStack Query, Helmet, the theme provider (`src/providers/theme`, built on `next-themes`: the single source of the light/dark choice, stored in `localStorage.theme`), tooltips, toasts, the root `ErrorBoundary`, and the router. |
| `src/app/App.tsx`, `src/routes/` | Lazily loaded routes. Each route is wrapped in a `RouteErrorBoundary`. |
| `src/layouts/` | `MainLayout`: header, navbar, footer. |
| `src/pages/` | One folder per route (`Article`, `Authors`, `About`, …). Pages compose features and components. |
| `src/features/` | Data-aware sections reused across pages (`Posts`, `FeaturedArticles`, `RelatedArticles`, `AuthorBadge`, …). |
| `src/components/` | Presentational components. `components/ui/<folder>` holds custom design-system pieces; top-level `components/ui/*.tsx` are vendored shadcn/ui primitives (currently unused, see BrianLusina/journal#803). |
| `src/hooks/cms/` | `usePosts` and `usePost`: React state around the CMS aggregator. |
| `src/hooks/api/` | Thin Apollo hooks for Contentful-only content. |
| `src/services/cms/` | The multi-CMS seam: `CMSAdapter` interface, adapters, adapter registry, aggregator. |
| `src/services/monitoring/`, `src/services/analytics/` | Sentry and Firebase Analytics wrappers. Both are no-ops outside production. |
| `src/integrations/contentful/` | The Contentful Apollo client instance, plus queries and fragments. |
| `src/clients/graphql/` | Apollo client factory and links (auth, retry, error reporting, HTTP). |
| `src/config/` | Typed access to `import.meta.env`. |
| `src/types/` | Ambient types: the unified post model (`cms.d.ts`) and Contentful GraphQL shapes (`gql/`). |
| `api/notion/` | Vercel Functions that hold the Notion credentials. They compile with `api/tsconfig.json` (CommonJS, Node resolution), not the root Vite config: Node loads them as CommonJS because `package.json` has no `"type": "module"`. |

### Path aliases

`tsconfig.app.json` is the **single source of truth** for import aliases (`@hooks`, `@cmsService`, `@/…`, and so on).

- Vite reads it through `vite-tsconfig-paths` (`vite.config.mts`).
- Jest generates its `moduleNameMapper` from it (`jest.config.js`).

Add new aliases there only. Before this was consolidated, three hand-copied lists drifted apart and broke most of the test suite.

## The CMS seam

### Unified model

Every source maps its content onto `UnifiedPost` (`src/types/cms.d.ts`): `id`, `source`, `title`, `slug`, `publishDate`, `tags: string[]`, `authors: UnifiedAuthor[]`, and optional `subtitle`, `description`, `category`, `body` (Markdown), `heroImage`, `thumbnail`. UI code that renders posts should depend on this model only, never on a CMS's own types.

`UnifiedAuthor` (`id`, `source`, `name`, `avatarUrl`, `shortBio`) carries everything `AuthorBadge` displays, so authors are never fetched again per badge. An author's `id` is only meaningful within its `source`; only Contentful authors link to the authors page. Notion returns people's names and avatars only when the integration has the **Read user information** capability; without it, Notion authors have no name and are not shown.

### Adapters

```ts
interface CMSAdapter {
  readonly source: CMSSource;
  // Next page of posts, newest first by publish date. Pass the previous page's nextCursor.
  getPosts(request: { cursor?: string; limit: number; category?: string; tag?: string }): Promise<{ items: UnifiedPost[]; nextCursor: string | null }>;
  getPostBySlug(slug: string): Promise<UnifiedPost | null>;
}
```

- **`ContentfulAdapter`** queries Contentful with the shared Apollo client (`network-only`), ordered by `publishDate_DESC`, and maps `BlogPostItem` to `UnifiedPost`. Its cursor is the offset of the next post. Listings only include posts that have a `publishDate`, the key the feed merges on.
- **`NotionAdapter`** calls `/api/notion/posts` and `/api/notion/posts/:slug`, and maps Notion page properties (`Title`, `Slug`, `Description`, `Category`, `Date`, `Tags`, `Author`, cover image). The `[slug]` function converts the page body to Markdown with `notion-to-md`, so both sources produce Markdown for `ArticlePage`. Its cursor is Notion's own `next_cursor`, passed through `/api/notion/posts?cursor=…`; each request reads one Notion page (at most 100 posts), so there is no limit on how far the feed can go. A Notion page is listed only when its `Status` is `Published`, its `Slug` is not empty (a post without a slug could never be opened) **and** its `Date` is set (the feed merges on publish date, so an undated post has no place in it).

`src/services/cms/adapters.ts` is the registry: an ordered array of adapter instances. Array order is priority order when two sources publish the same slug.

### Aggregator

`src/services/cms/aggregator.ts` holds the multi-source logic as plain async functions, testable without React:

- **`createMergedFeed(adapters, { category?, tag? })`** returns a feed with `load(count)`, which resolves to the first `count` posts across all sources, newest first.
  - Every adapter returns its posts newest first, so the feed is a k-way merge: it keeps a cursor and a buffer per source and only fetches a source's next page when its buffer runs out. A larger `count` reads on from where the feed stopped and never refetches.
  - Loads are serialized, so overlapping calls never fetch the same cursor twice.
  - `hasMore` is true while any source has buffered or unread posts.
  - Each request asks for at least 10 posts, a page can come back empty while the source still has more, and a post is shown once even if offset pages overlap because a post was published between requests. If a post is unpublished between requests instead, the next offset page skips one post until the feed is recreated.
  - **Partial failure:** a failing source is left out of the load instead of hiding the others, and its error is returned in that load's `errors`. The next load retries it from its cursor; any of its posts newer than those already shown then appear after them. A load only rejects when every source failed in it and nothing was read.
- **`findPostBySlug(adapters, slug)`** queries all sources concurrently and returns the first hit in priority order. It resolves to `null` only when every source answered "not found". If the post wasn't found and any source failed, it rejects, because the post might exist in the failed source.

The hooks are thin. `usePosts({ limit, category, tag })` keeps one feed per category and tag, so raising `limit` ("Load more") only fetches the missing posts; it reports partial-failure errors to Sentry and exposes `{ data, loading, error }`. `usePost` turns `null` into "no data, no error", which `ArticlePage` turns into a redirect to `/404`.

### Adding a content source

1. Add the source name to `CMSSource` in `src/types/cms.d.ts`.
2. Implement `CMSAdapter` in `src/services/cms/<Name>Adapter.ts`, mapping onto `UnifiedPost`. Body text must be Markdown.
3. If the source needs a secret, put the calls behind a function in `api/` (as Notion does). Never use a `VITE_`-prefixed variable for a secret, because Vite inlines those into the browser bundle.
4. Register an instance in `src/services/cms/adapters.ts`.
5. Add `<Name>Adapter.spec.ts` covering mapping, fallbacks, pagination and not-found. `ContentfulAdapter.spec.ts` and `NotionAdapter.spec.ts` show the pattern.

No hook, page or aggregator change is needed.

### Tags

A tag is identified by its **name**, the only identifier every source shares. `Tag` links to `/article/tag/<encoded name>`, and `usePosts({ tag })` passes the name to every adapter. Matching is exact, so tags spelled differently in two places (`JavaScript` and `javascript`) are different tags.

- **Contentful** posts carry tags in two places:
  - Contentful tags (`contentfulMetadata.tags`), used by newer posts;
  - the legacy `tags` field (`Array<Symbol>`), used by older ones.

  The adapter shows both, de-duplicated, and filters on either: `tags_contains_some: [name]` OR the Contentful tag's ID. Contentful tags can only be filtered by ID, so `getTagId` (`src/integrations/contentful/contentful.tags.ts`) looks the name up in the space's tag list, fetched once per page load from the delivery REST API (`/tags`). The GraphQL API can't list tags. If the tag list can't be fetched, the adapter still filters the legacy field by name.
- **Notion** filters `Tags` with `multi_select.contains` on the name. Most tags aren't Notion's, so `/api/notion/posts?tag=` first checks that the name is one of the `Tags` options, and answers with no posts without querying when it isn't.

### Content outside the seam

Every post listing reads through the seam. Authors, About and Social content exist only in Contentful and stay on Apollo (`hooks/api/*` and the features that render them).

## Error handling and observability

- **Error boundaries:** a root `ErrorBoundary` in `main.tsx`, and a `RouteErrorBoundary` per route that reports the crash tagged with its `location` and shows the error message.
- **Data errors:** pages render an inline message and call `captureException`. A single failing CMS source is reported but doesn't block rendering.
- **GraphQL errors:** `errorMiddleware` (Apollo `onError`) reports them to Sentry. It must sit *before* the terminating `HttpLink`; links after a terminating link never run.
- **Production gating:** Sentry, error capture and Firebase Analytics only run when `import.meta.env.MODE === 'production'`.
- **Lazy Firebase:** the Firebase SDK is downloaded with `import()` on the first event, and only when `VITE_FIREBASE_PROJECT_ID` is set, so a missing optional config cannot blank the app. Events logged while it loads are sent in order once it has.
- **Lazy Sentry:** `initializeMonitoring()` downloads the Sentry SDK with `import()` once the browser is idle (`requestIdleCallback`), after the first paint. Errors reported before then are queued and sent once Sentry is initialized. Code reports through `@monitoring` only; importing `@sentry/*` anywhere else pulls the SDK back into the first bundle. Trade-off: an error thrown while the page is still loading is only reported if the page lives until Sentry loads, and nothing is reported if the Sentry chunk fails to download.
- **Bundle budget:** `bun run check:bundle-size` (`scripts/bundle-budget.js`) fails the Build workflow when the entry chunk plus the chunks `index.html` preloads exceed 185 kB gzipped. Load a new SDK lazily rather than raising the budget.

## Configuration

All browser configuration is read in `src/config/` from `import.meta.env`. Only `VITE_*` variables (plus Vite's `MODE`, `DEV`, `PROD`) exist there; `NODE_ENV` and other unprefixed names are always `undefined` in the browser. See `.env.sample` for the full list.

| Variable | Used by |
|---|---|
| `VITE_CONTENTFUL_CMS_*` | Contentful client (space, environment, delivery token, GraphQL URL). |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_TRACES_SAMPLE_RATE` | Sentry (production only). |
| `VITE_FIREBASE_*` | Firebase Analytics (optional, production only). |
| `VITE_ENV`, `VITE_APP_NAME`, `VITE_APP_TITLE` | Environment label and site naming. |
| `NOTION_API_KEY`, `NOTION_DATA_SOURCE_ID` (or `NOTION_DATABASE_ID`) | **Server only**, read by `api/notion`. Queries target a data source (Notion API 2025-09-03). `getDataSourceId()` in `api/notion/_shared.ts` uses `NOTION_DATA_SOURCE_ID` as is, or looks up the first data source of `NOTION_DATABASE_ID` once per function instance. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Build only: source-map upload by `@sentry/vite-plugin`. |

## Deployment topology

- The SPA is static (`dist/`). The Notion integration **requires** a host that runs the `api/` functions; today that is Vercel, which builds every PR as a preview.
- A static-only host (Surge, nginx Docker image, GitHub Pages) serves the app with Contentful content only. The aggregator degrades gracefully, but Notion posts won't appear.
- `vite dev` does not run `api/`. Use `vercel dev` to work on Notion content locally (BrianLusina/journal#802).

## Testing

- **Runner:** Jest 26 with jsdom and React Testing Library; specs sit next to their code as `*.spec.ts(x)`.
- **Command:** run with `bun run test` (Jest). **Not** `bun test`, which runs Bun's own runner without `jest.config.js` and fails.
- **Coverage gate:** `bun run test:coverage` enforces 85% lines and statements. Vendored shadcn/ui primitives at the top level of `src/components/ui` are excluded.
- **What to test where:**
  - Multi-source behaviour goes in `aggregator.spec.ts`, with fake adapters.
  - Per-CMS mapping goes in adapter specs (Apollo client or `fetch` mocked).
  - Hooks are tested against a mocked aggregator.
  - Pages and features are tested against mocked hooks.
- **CI:** GitHub Actions runs tests with coverage, ESLint and stylelint, and a production build on every push. All use bun with the committed text lockfile `bun.lock`. Dependabot updates it through the `bun` ecosystem.
- **Not yet in CI:** type-checking `src/` with `tsc` (BrianLusina/journal#804). `vite build` does not type-check. The Vercel functions in `api/` (not their specs) are type-checked by the Lint workflow (`bun run typecheck:api`), and `scripts/api-functions.spec.ts` checks that the config Vercel compiles each one with emits CommonJS.

## Known limits and follow-ups

| Area | Issue |
|---|---|
| Notion doesn't work under `vite dev` | BrianLusina/journal#802 |
| Unused shadcn/ui primitives | BrianLusina/journal#803 |
| No type-checking in CI | BrianLusina/journal#804 |
| Contact and newsletter forms don't submit | BrianLusina/journal#805 |
| About page fetches content it doesn't render | BrianLusina/journal#806 |
| Docker, Storybook and deploy workflows left over from CRA | BrianLusina/journal#807 |
| React Testing Library 11 renders in legacy mode | BrianLusina/journal#808 |
