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
| `src/main.tsx` | Entry point. Mounts the provider tree: Apollo (Contentful client), TanStack Query, Helmet, tooltips, toasts, the root `ErrorBoundary`, and the router. |
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
| `api/notion/` | Vercel Functions that hold the Notion credentials. |

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
  getPosts(options?: { skip?; limit?; category? }): Promise<PaginatedUnifiedPosts>;
  getPostBySlug(slug: string): Promise<UnifiedPost | null>;
}
```

- **`ContentfulAdapter`** queries Contentful with the shared Apollo client (`network-only`) and maps `BlogPostItem` to `UnifiedPost`.
- **`NotionAdapter`** calls `/api/notion/posts` and `/api/notion/posts/:slug`, and maps Notion page properties (`Title`, `Slug`, `Description`, `Category`, `Date`, `Tags`, `Author`, cover image). The `[slug]` function converts the page body to Markdown with `notion-to-md`, so both sources produce Markdown for `ArticlePage`. A Notion page is listed only when its `Status` is `Published` **and** its `Slug` is not empty, since a post without a slug could never be opened.

`src/services/cms/adapters.ts` is the registry: an ordered array of adapter instances. Array order is priority order when two sources publish the same slug.

### Aggregator

`src/services/cms/aggregator.ts` holds the multi-source logic as plain async functions, testable without React:

- **`fetchMergedPosts(adapters, { skip, limit, category })`**
  - Each source can only page its own content, so each is asked for its first `skip + limit` posts.
  - The results are merged newest first by `publishDate`, and the requested page is sliced out.
  - `hasMore` is true when merged posts were cut off by the slice, or when any source reports more.
  - **Partial failure:** a failing source does not hide the others. Its error is returned in `errors`, and the call only rejects when every source fails.
- **`findPostBySlug(adapters, slug)`** queries all sources concurrently and returns the first hit in priority order. It resolves to `null` only when every source answered "not found". If the post wasn't found and any source failed, it rejects, because the post might exist in the failed source.

The hooks are thin. `usePosts` reports partial-failure errors to Sentry and exposes `{ data, loading, error }`. `usePost` turns `null` into "no data, no error", which `ArticlePage` turns into a redirect to `/404`.

### Adding a content source

1. Add the source name to `CMSSource` in `src/types/cms.d.ts`.
2. Implement `CMSAdapter` in `src/services/cms/<Name>Adapter.ts`, mapping onto `UnifiedPost`. Body text must be Markdown.
3. If the source needs a secret, put the calls behind a function in `api/` (as Notion does). Never use a `VITE_`-prefixed variable for a secret, because Vite inlines those into the browser bundle.
4. Register an instance in `src/services/cms/adapters.ts`.
5. Add `<Name>Adapter.spec.ts` covering mapping, fallbacks, pagination and not-found. `ContentfulAdapter.spec.ts` and `NotionAdapter.spec.ts` show the pattern.

No hook, page or aggregator change is needed.

### Where the seam is not used yet

Some post listings still query Contentful directly through Apollo, so Notion posts don't appear there:

- `FeaturedArticles` (home page)
- `ArticlesByTagPage`
- `useFetchArticle` and `useFetchArticlesByCategory`

Migrating them is tracked in BrianLusina/journal#801. Authors, About and Social content exist only in Contentful and are expected to stay on Apollo.

## Error handling and observability

- **Error boundaries:** a root `ErrorBoundary` in `main.tsx`, and a Sentry `RouteErrorBoundary` per route.
- **Data errors:** pages render an inline message and call `captureException`. A single failing CMS source is reported but doesn't block rendering.
- **GraphQL errors:** `errorMiddleware` (Apollo `onError`) reports them to Sentry. It must sit *before* the terminating `HttpLink`; links after a terminating link never run.
- **Production gating:** Sentry, error capture and Firebase Analytics only run when `import.meta.env.MODE === 'production'`.
- **Lazy Firebase:** Firebase Analytics is created on first event, and only when `VITE_FIREBASE_PROJECT_ID` is set, so a missing optional config cannot blank the app.

## Configuration

All browser configuration is read in `src/config/` from `import.meta.env`. Only `VITE_*` variables (plus Vite's `MODE`, `DEV`, `PROD`) exist there; `NODE_ENV` and other unprefixed names are always `undefined` in the browser. See `.env.sample` for the full list.

| Variable | Used by |
|---|---|
| `VITE_CMS_*` | Contentful client (space, environment, delivery token, GraphQL URL). |
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
- **CI:** GitHub Actions runs tests with coverage, ESLint and stylelint, and a production build on every push. All use bun with the committed `bun.lockb`.
- **Not yet in CI:** type-checking with `tsc` (BrianLusina/journal#804). `vite build` does not type-check.

## Known limits and follow-ups

| Area | Issue |
|---|---|
| Merged pagination refetches from zero; Notion is capped at 100 posts | BrianLusina/journal#799 |
| Home featured articles and tag pages bypass the CMS seam | BrianLusina/journal#801 |
| Notion doesn't work under `vite dev` | BrianLusina/journal#802 |
| Unused shadcn/ui primitives | BrianLusina/journal#803 |
| No type-checking in CI | BrianLusina/journal#804 |
| Contact and newsletter forms don't submit | BrianLusina/journal#805 |
| About page fetches content it doesn't render | BrianLusina/journal#806 |
| Docker, Storybook and deploy workflows left over from CRA | BrianLusina/journal#807 |
| React Testing Library 11 renders in legacy mode | BrianLusina/journal#808 |
| Toasts ignore the site's dark mode toggle | BrianLusina/journal#809 |
| 689 kB main bundle | BrianLusina/journal#810 |
