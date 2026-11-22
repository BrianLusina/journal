# Architecture

This document describes how the journal site is put together: where content comes from, how it flows to the page, and the decisions and known limits behind that design. For setup and commands, see the [README](../README.md).

## Overview

The site is a client-rendered React 18 single-page app built with Vite. Posts can come from more than one content management system (CMS): today **Contentful** and **Notion**, both read on the server by `@brianlusina/cms` (`packages/cms`) and served through functions in `api/`, so their tokens stay on the server and the browser only ever receives `UnifiedPost`s. `apps/sites` will read the same sources with the same package, without the HTTP hop. Contentful content that is not a post (authors, About, Social) is still queried from the browser.

```text
             Browser (React SPA)                          Server (Vercel Functions, Docker server)
┌───────────────────────────────────────────────┐     ┌────────────────────────────────────────────┐
│ pages/ & features/                            │     │ api/contentful/*  api/notion/*              │
│   │ usePosts / usePost (hooks/cms)            │     │   HTTP only: method, params, caching       │
│   ▼                                           │     │   │                                        │
│ createMergedFeed / findPostBySlug             │     │   ▼  @brianlusina/cms/server               │
│   (@brianlusina/cms) over cmsAdapters         │     │ contentfulSource ── Contentful GraphQL+REST│
│   ├── createApiAdapter('contentful') ── fetch('/api/contentful/…') ─▶  map → UnifiedPost        │
│   └── createApiAdapter('notion') ───── fetch('/api/notion/…') ─────▶ notionSource ── Notion API │
│         (UnifiedPost JSON, no mapping)        │     │   map → UnifiedPost, notion-to-md (body)   │
└───────────────────────────────────────────────┘     └────────────────────────────────────────────┘
```

Authors, About and Social content bypasses `api/`: `hooks/api/*` and the features that render it query the Contentful GraphQL API directly from the browser with Apollo.

## Source layout

The repository is a bun workspace (`workspaces: ["apps/*", "packages/*"]` in the root `package.json`):

| Path | Responsibility |
|---|---|
| `/` (root) | Repo-wide tooling and its config: ESLint, husky, lint-staged, commitlint, Danger, Playwright and `e2e/`, the Dockerfile and `.make/`, CI. Its scripts forward to the app (`bun run --filter blog <script>`), so every command runs from here. One `bun.lock` for the workspace. |
| `packages/cms/` | `@brianlusina/cms`: the post models, the CMS sources and the merged feed (see [The CMS seam](#the-cms-seam)). |
| `packages/ui/` | `@brianlusina/ui`: the design system, with its tokens, Tailwind preset, shared components and the cross-site theme (see [Design system](#design-system)). |
| `apps/sites/` | `brianlusina.com` and `folio.brianlusina.com`: one Astro server app that serves each site by hostname (see [apps/sites](#appssites)). The `yggdrasil` Vercel project's Root Directory. |
| `studio/` | Sanity Studio, where Sanity posts are written. **Outside the bun workspace**, with its own `bun.lock`: Studio needs React 19, and the blog is on React 18. Its schema (`schemaTypes/`) is extracted to `schema.json`, which `packages/cms` reads (see [Sanity schema](#sanity-schema)). |
| `apps/blog/` | The blog: the app, its `api/` functions, the Docker server and the app's config (Vite, Vitest, TypeScript, Tailwind, Storybook, stylelint, `vercel.json`, `.env.sample`). The Vercel project's Root Directory. |

Unless a path starts at the repository root (`e2e/`, `.github/`, `Dockerfile`) or is in [apps/sites](#appssites), the paths in this document are relative to `apps/blog/`.

| Path | Responsibility |
|---|---|
| `src/main.tsx` | Entry point. Mounts the provider tree: Apollo (Contentful client), TanStack Query, Helmet, the theme provider (`src/providers/theme`, built on `next-themes`: the single source of the light/dark choice, stored in `localStorage.theme`), tooltips, toasts, the root `ErrorBoundary`, and the router. |
| `src/app/App.tsx`, `src/routes/` | Lazily loaded routes. Each route is wrapped in a `RouteErrorBoundary`. |
| `src/layouts/` | `MainLayout`: header, navbar, footer. |
| `src/pages/` | One folder per route (`Article`, `Authors`, `About`, …). Pages compose features and components. |
| `src/features/` | Data-aware sections reused across pages (`Posts`, `FeaturedArticles`, `RelatedArticles`, `AuthorBadge`, …). |
| `src/components/` | Presentational components. `components/ui/<folder>` holds custom design-system pieces. Top-level `components/ui/*.tsx` is where shadcn/ui primitives go (`bunx shadcn add <name>`); add one only when the app imports it, which `scripts/ui-primitives-policy.spec.ts` enforces. |
| `src/hooks/cms/` | `usePosts` and `usePost`: React state around the CMS aggregator. |
| `src/hooks/api/` | Thin Apollo hooks for Contentful content that is not a post (authors, About, Social). |
| `src/services/cms/` | The browser side of the CMS seam: `createApiAdapter` (one thin fetcher per source's `api/` routes) and the adapter registry. The models, the `CMSAdapter` interface and the aggregator come from `@brianlusina/cms` (see [The CMS seam](#the-cms-seam)). |
| `src/services/search/` | Site search: the search index, MiniSearch ranking and the search analytics rules (see [Search](#search)). |
| `src/services/monitoring/`, `src/services/analytics/` | Sentry and Firebase Analytics wrappers. Both are no-ops outside production. |
| `src/integrations/contentful/` | The Contentful Apollo client instance, plus the queries and fragments for authors, About and Social content. Post queries live in `packages/cms/src/contentful/client.ts`. |
| `src/clients/graphql/` | Apollo client factory and links (auth, retry, error reporting, HTTP). |
| `src/config/` | Typed access to the `VITE_*` configuration through `readEnv` (see [Configuration](#configuration)). |
| `src/types/` | Ambient types: the unified post model (`cms.d.ts`) and Contentful GraphQL shapes (`gql/`). |
| `api/contentful/`, `api/notion/` | Vercel Functions that hold the CMS credentials. They only do HTTP (method, parameters, status codes, caching) and call the sources in `@brianlusina/cms/server`, which do the querying and mapping. `api/_routes.ts` has what both share: the method check, `limit` and query-parameter parsing, and the cache header. They compile with `api/tsconfig.json` (CommonJS, Node resolution), not the root Vite config: Node loads them as CommonJS because `package.json` has no `"type": "module"`. |
| `server/` | The Docker image's Bun server. It serves `dist/`, runs the `api/` functions through a Vercel adapter and sets the runtime configuration in `index.html`. Vercel doesn't use it. |
| `api/contact.ts`, `api/subscribe.ts`, `api/_forms/` | Vercel Functions behind the contact form and the newsletter signup (see [Forms](#forms)). `shared/forms.ts` holds the zod schemas that the forms in `src/` import too. |
| `shared/` | The contract between `api/` and `src/`: the form schemas (`forms.ts`). The Notion property names and listing filters moved to `packages/cms/src/notion/properties.ts`. Import it as `@shared/*` from `src/` and relatively from `api/`. Keep it free of Node and DOM APIs, and never put source that the browser imports under `api/`: the dev server proxies `/api/*` to `vercel dev`. |

### Path aliases

`tsconfig.app.json` is the **single source of truth** for import aliases (`@hooks`, `@cmsService`, `@/…`, and so on).

- Vite reads it through `vite-tsconfig-paths` (`vite.config.mts`).
- Vitest reuses `vite.config.mts`, and with it those aliases (`vitest.config.mts`).

Add new aliases there only. Before this was consolidated, three hand-copied lists drifted apart and broke most of the test suite.

## Design system

`packages/ui` (`@brianlusina/ui`) is the look every site shares. It holds:

- **`styles.css`**: the design tokens (the `:root` and `.dark` HSL variables), base styles, utilities such as `card-hover`, `pill-nav` and `floating-button`, the keyframes, and the `tag-*` category colours.
- **`tailwind-preset.ts`**: the tokens as a Tailwind 3 preset, with `darkMode: ['class']`, plus `uiContent`, the globs of the package's own files.
- **`index.ts`**: the React components (`Button`, `ArticleCard`, `Tag`/`Tags`, `ThemeToggle`), `cn`, `getCategoryClass`, `LinkProvider` and the theme helpers.

**Using it in an app:**
1. Import `@brianlusina/ui/styles.css` once.
2. Set `presets: [preset]` and `content: [...yourGlobs, ...uiContent]` in the app's Tailwind config. Tailwind only generates the classes it finds in `content`, so without `uiContent` the package's components render unstyled.

The blog does both in `src/styles/css/index.css` and `tailwind.config.ts`. Its built CSS is byte-identical to what it was before the extraction.

**Links.** Components link through `Link`. With no `LinkProvider`, that is a plain `<a href>`, which is what Astro pages want. An app with a client-side router passes its own link component. The blog's `ArticleCard` and `Tag` entry points (`src/components/ArticleCard`, `src/components/ui/tag`) bind React Router's link inside themselves, so they navigate client-side under any router, tests included. They also build the blog's own URLs from `id`/`slug` and from the tag name. `scripts/repo-policy.spec.ts` keeps `react-router` out of the package.

**Theme across sites.** The sites store the reader's light/dark choice in a `theme` cookie with `Domain=.brianlusina.com`, so a choice made on one site carries to the others. On any other host (Vercel previews, localhost, Docker), the cookie stays on that host, because a browser drops a Domain the host doesn't match (`themeCookieDomain`). An app inlines `themeScript` in `<head>`. It applies the `dark` class before paint, from the cookie or else the system preference, so there is no flash of the wrong theme (#829). `ThemeToggle` flips the class and writes the cookie. **The blog doesn't use this yet.** It keeps `next-themes` and `localStorage.theme` (`src/providers/theme`) until it adopts the shared pieces after cutover, as a separately approved change.

**Adding to it.** Put a component in `packages/ui` only when a second app needs it, with its spec and story next to it. App-only components stay in the app. shadcn/ui primitives arrive with the first page that imports them (`scripts/ui-primitives-policy.spec.ts`). The package's Storybook (`bun run --filter @brianlusina/ui storybook:dev`) builds Tailwind from the preset and `uiContent` alone, so it shows what any app will get.

## The CMS seam

The seam lives in `packages/cms` (`@brianlusina/cms`), in three layers:

1. **Source** (`packages/cms/src/<source>/`): `client.ts` (credentials and the CMS's API), `map.ts` (the CMS's shape → `UnifiedPost`) and `source.ts` (a `CMSAdapter` over both). Exported from `@brianlusina/cms/server`, server-only.
2. **Route** (`apps/blog/api/<source>/`): HTTP only. It calls the source and answers its result as JSON.
3. **Browser** (`apps/blog/src/services/cms/`): `createApiAdapter(source)`, a `CMSAdapter` that fetches the routes and returns their JSON as it is.

`@brianlusina/cms` (the root entry, `packages/cms/index.ts`) is browser-safe: the models, `CMSAdapter` and the aggregator. An ESLint rule keeps CMS clients, credentials and Node imports out of it. `apps/sites` (Astro) will call the aggregator over the server sources directly.

### Unified model

Every source maps its content onto `UnifiedPost` (`packages/cms/src/types.ts`; the blog keeps the names global through aliases in `src/types/cms.d.ts`): `id`, `source`, `title`, `slug`, `publishDate`, `tags: string[]`, `authors: UnifiedAuthor[]`, and optional `subtitle`, `description`, `category`, `body` (Markdown), `heroImage`, `thumbnail`. UI code that renders posts should depend on this model only, never on a CMS's own types.

`UnifiedAuthor` (`id`, `source`, `name`, `avatarUrl`, `shortBio`) carries everything `AuthorBadge` displays, so authors are never fetched again per badge. An author's `id` is only meaningful within its `source`; only Contentful authors link to the authors page. A Notion post has at most one author, named by its `Authors` text property (typed, or a mention of a workspace member), and no avatar. Notion gives a mentioned member's name only when the integration has the **Read user information** capability; without it, type the name instead of mentioning.

### Adapters

```ts
interface CMSAdapter {
  readonly source: CMSSource;
  // Next page of posts, newest first by publish date. Pass the previous page's nextCursor.
  getPosts(request: { cursor?: string; limit: number; category?: string; tag?: string }): Promise<{ items: UnifiedPost[]; nextCursor: string | null }>;
  getPostBySlug(slug: string): Promise<UnifiedPost | null>;
  // Every listed post without its body, for the search index (see Search).
  getSearchIndex(): Promise<UnifiedPost[]>;
}
```

`CMSPage` may also carry `partial: true`: the source answered without everything it should have (Contentful, when its tag list can't be read), so the route doesn't let the edge cache keep it.

- **`contentfulSource`** queries the Contentful GraphQL API with the delivery token, ordered by `publishDate_DESC`, and maps each post onto `UnifiedPost`. `/api/contentful/posts` answers `{ results, nextCursor }` and the slug route answers `{ post }`. The cursor is the offset of the next post; the route answers 400, and the source rejects, for a cursor that isn't a non-negative integer. Listings only include posts that have a `publishDate`, the key the feed merges on.
- **`notionSource`** queries the data source and maps the page properties listed under [Notion schema](#notion-schema). Its slug lookup converts the page body to Markdown with `notion-to-md`, so both sources produce Markdown for `ArticlePage`, and the slug route answers `{ post }` with the body in it. Its cursor is Notion's own `next_cursor`, passed through `/api/notion/posts?cursor=…`; each request reads one Notion page (at most 100 posts), so there is no limit on how far the feed can go. A Notion page is **published** when its `Status` is `Published` **and** `Published` (the date) is set (the feed merges on publish date, so an undated post has no place in it). It is listed only when it is published and its `Slug` is not empty (a post without a slug could never be opened), and opened by slug only when it is published.
- **`sanitySource`** queries Sanity's HTTP API with GROQ (`packages/cms/src/sanity/`), with no client SDK. The datasets are private, so every read needs the Viewer token (`SANITY_API_TOKEN`); without it the source isn't configured. A Viewer token can also read drafts, so `querySanity` always sends `perspective=published`, and no caller can change it: that is what keeps drafts off the site. Values are sent as GROQ `$parameters`, never written into the query. A post is **listed** when it is a `blogPost` with a `slug` and a `publishDate`, the same rule for listings, the search index and slug lookup. The cursor is the offset of the next post, as for Contentful, and the route answers 400 for one that isn't. Tags are `tag` documents, so `?tag=` matches `$tag in tags[]->name`, and a tag whose reference is broken is left out. The body (Portable Text) becomes Markdown with `toMarkdown` (`packages/cms/src/sanity/markdown.ts`), written for exactly what the schema's body allows: headings, quotes, lists, decorators, links, code blocks (fenced with their language) and images (from the URL the query resolves); other block types are left out. It's hand-written because `@portabletext/markdown` is ES-only, and the blog's CommonJS functions can't load an ES-only package on every runtime: one that fails to load crashes every route that imports `@brianlusina/cms/server`. `packages/cms/dependencies.spec.ts` checks that every runtime dependency loads as CommonJS without `require(esm)`. Images are served from Sanity's CDN, whose URLs don't expire (but are public, even in a private dataset).
- **`createApiAdapter(source)`** is the browser's adapter for either source. It builds the route URLs, answers `null` on a 404, and rejects with "Unable to fetch <Source> posts: <status>" (or post, or search index) on any other error.

`e2e/blog/api.spec.ts` checks each posts route on the deployment: it answers 200 with a page whose first post is a `UnifiedPost`, not the CMS's own shape. It checks no post shape when a source answers an empty page, and skips a source the deployment hasn't configured (500 `{ error: '<Source> is not configured' }`); a crashed function still fails it. Neither the slug nor the search-index routes are checked on the deployment.

#### Notion schema

`notionSource` reads the 📰 Journal CMS data source, whose properties mirror the Contentful blog post fields. Every property name lives in `packages/cms/src/notion/properties.ts`, shared by the queries and the mapping. Notion matches names exactly, case included, and rejects a whole query (the routes then answer 502) when a filter or sort names a property it doesn't have or uses the wrong type. **A rename or type change in the database needs the same change in `properties.ts`, `map.ts` (both in `packages/cms/src/notion/`) and this table.**

| Property | Notion type (API type) | Used for | `UnifiedPost` field |
|---|---|---|---|
| `Title` | Title (`title`) | | `title` (`Untitled` when empty) |
| `Slug` | Text (`rich_text`) | Listed only when not empty; the slug route matches it exactly | `slug` |
| `Description` | Text (`rich_text`) | | `description` |
| `Categories` | Multi-select (`multi_select`) | `?category=` filter (`multi_select.contains`) | `category` (the first option; a post has one category, as in Contentful) |
| `Published` | Date (`date`) | Published only when set; sort, newest first | `publishDate` |
| `Status` | Status (`status`) | Published only when `Published` (the other options are Draft, In progress and Changed) | |
| `Tags` | Multi-select (`multi_select`) | `?tag=` filter (`multi_select.contains`, see [Tags](#tags)) | `tags` |
| `Authors` | Text (`rich_text`) | | `authors` (one author, or none when empty) |
| `Cover Image` | Files & media (`files`) | First file | `heroImage` and `thumbnail`. Files uploaded to Notion have links that expire after an hour; the routes cache for at most 6 minutes. |

`Draft` (checkbox) also exists in the database but isn't read: `Status` decides whether a post is published. Text values are joined across their segments, since Notion splits text wherever its formatting changes.

`src/services/cms/adapters.ts` is the browser's registry: an ordered array of `createApiAdapter` instances. Array order is priority order when two sources publish the same slug. Notion is registered only while the `notion` feature flag is on (see `VITE_FEATURES`); while it is off, the site never calls `/api/notion`, and Notion posts are neither listed nor found by slug. Sanity is registered last, and only while the `sanity` flag is on.

#### Sanity schema

Studio's schema lives in `studio/schemaTypes/`. `packages/cms` can't import it (it depends on `sanity`), so Studio extracts it to `studio/schema.json` (`bun run schema:extract` in `studio/`), and `packages/cms/src/sanity/projection.spec.ts` checks that every field the GROQ projections read exists there. Studio's CI fails when `schema.json` is out of date. **A field change needs the same change in `studio/schemaTypes/`, `studio/schema.json`, `projection.ts`, `map.ts` (both in `packages/cms/src/sanity/`) and this table.**

| Field (`blogPost`) | Sanity type | Used for | `UnifiedPost` field |
|---|---|---|---|
| `title` | `string`, required | | `title` |
| `slug` | `slug` (from the title), required | Listed only when set; the slug route matches it exactly | `slug` |
| `subtitle` | `string` | | `subtitle` |
| `description` | `text` | | `description` |
| `category` | `string` | `?category=` filter | `category` |
| `tags` | references to `tag` documents (`name`, `slug`, `description`) | `?tag=` filter, by the tag's `name` | `tags` (the names) |
| `authors` | references to `author` documents (`name`, `image`, `shortBio`) | | `authors` (`avatarUrl` from the image) |
| `publishDate` | `datetime`, required | Listed only when set; sort, newest first | `publishDate` |
| `heroImage`, `thumbnail` | `image`, with `alt` | | `heroImage`, `thumbnail` (`description` from `alt`) |
| `body` | Portable Text: blocks, `image` (with `alt`) and `code` (`@sanity/code-input`) | | `body` (Markdown) |
| `featured` | `boolean`, default false | Not read yet (P10) | |

### Aggregator

`packages/cms/src/aggregator.ts` holds the multi-source logic as plain async functions, testable without React:

- **`createMergedFeed(adapters, { category?, tag? })`** returns a feed with `load(count)`, which resolves to the first `count` posts across all sources, newest first.
  - Every adapter returns its posts newest first, so the feed is a k-way merge: it keeps a cursor and a buffer per source and only fetches a source's next page when its buffer runs out. A larger `count` reads on from where the feed stopped and never refetches.
  - Loads are serialized, so overlapping calls never fetch the same cursor twice.
  - `hasMore` is true while any source has buffered or unread posts.
  - Each request asks for at least 10 posts, a page can come back empty while the source still has more, and a post is shown once even if offset pages overlap because a post was published between requests. If a post is unpublished between requests instead, the next offset page skips one post until the feed is recreated.
  - **Partial failure:** a failing source is left out of the load instead of hiding the others, and its error is returned in that load's `errors`. The next load retries it from its cursor; any of its posts newer than those already shown then appear after them. A load only rejects when every source failed in it and nothing was read.
- **`findPostBySlug(adapters, slug)`** queries all sources concurrently and returns the first hit in priority order. It resolves to `null` only when every source answered "not found". If the post wasn't found and any source failed, it rejects, because the post might exist in the failed source.

The hooks are thin. `usePosts({ limit, category, tag })` keeps one feed per category and tag, so raising `limit` ("Load more") only fetches the missing posts; it reports partial-failure errors to Sentry and exposes `{ data, loading, error }`. `usePost` turns `null` into "no data, no error", which `ArticlePage` turns into a redirect to `/404`.

### Adding a content source

1. Add the source name to `CMSSource` in `packages/cms/src/types.ts` (the blog's alias in `src/types/cms.d.ts` follows it).
2. In `packages/cms/src/<source>/`, add `client.ts` (credentials from server-only variables, never `VITE_`-prefixed: Vite inlines those into the browser bundle), `map.ts` (onto `UnifiedPost`, body as Markdown) and `source.ts` (a `CMSAdapter`, including `getSearchIndex()`: every listed post, without its body, read to the source's end). Give each a spec next to it; `packages/cms/src/notion/` shows the pattern. Export the source and an `is<Source>Configured()` from `packages/cms/server.ts`. Importing `server.ts` must not throw when the source isn't configured (`packages/cms/server.spec.ts`).
3. Add the three routes in `apps/blog/api/<source>/` (`posts.ts`, `posts/[slug].ts`, `search-index.ts`), copying a sibling: HTTP only, with the helpers in `api/_routes.ts`.
4. Register `createApiAdapter('<source>')` in `src/services/cms/adapters.ts`, and add the source's name to `SOURCE_NAMES` in `apiAdapter.ts`.
5. Add the source to `SOURCES` in `e2e/blog/api.spec.ts`.

No hook, page or aggregator change is needed.

### Search

Search runs in the browser over an index of every post's metadata, so results are ranked, consistent across sources, and need no request per keystroke. Post bodies are not searched (see #886 for the options weighed and the decisions behind this).

- **Index routes.** `GET /api/contentful/search-index`, `GET /api/notion/search-index` and `GET /api/sanity/search-index` answer `{ results }` with every listed post of their source, as `UnifiedPost`s like the posts routes, by the same listing rules (`publishDate_exists`; `listedFilters` in `packages/cms/src/notion/properties.ts`). Contentful uses a slim query, `GET_SEARCH_INDEX`, without bodies or hero images; a Notion query never returns bodies. Each route reads 100 posts per CMS request until the source is exhausted, so no post is left out once a source passes one page, and sets `X-Search-Documents` to the number of posts (read it from a response with `curl -i`; request logs don't record response headers). The Sentry breadcrumb below records the size each reader's browser loads. Responses are edge-cached like the posts routes, so the index costs one CMS request per 100 posts per cache refresh.
- **Index.** `loadSearchIndex` (`src/services/search/searchIndex.ts`) calls `getSearchIndex()` on every registered adapter, so the adapters' existing mapping applies and the `notion` flag is respected: while it is off, nothing calls `/api/notion`. A failing source is left out and reported to Sentry, as in the feed; loading fails only when every source fails. Documents are `SearchDocument`s: title, subtitle, description, category, tags, author names, slug, date and thumbnail.
- **Ranking.** `createSearchEngine` (`searchEngine.ts`) indexes them with MiniSearch. Every word of the query must match, as a prefix or with one typo in a word of five characters or more; field boosts rank title over tags, then subtitle and description, then author and category. Queries under two characters return nothing. Both sit behind the `SearchEngine` interface, so moving search to the server (to search bodies, or past a couple of thousand posts) only replaces the index source and this module.
- **Loading.** `src/services/search/index.ts` holds MiniSearch and is only loaded with `import()`, by `useSearch` (`src/hooks/search`), the first time a search is shown. The loaded engine is shared by the modal and the page for 5 minutes, the routes' edge-cache lifetime, so new posts and Notion's expiring signed thumbnail links don't go stale in a long-open tab; `useSearch` asks for it again on each query and each time the modal opens, which costs nothing while it is fresh. An engine built while a source failed is used but not kept, so the next search retries that source. Load time and document count go to Sentry as a breadcrumb.
- **UI.** `SearchLauncher`, in the navbar, is the search button and the ⌘K / Ctrl+K / `/` shortcuts (ignored while typing in a field). It loads `SearchDialog` with `lazy()` on first use: a Radix dialog whose input is a combobox over the best 8 results (↑/↓, Enter, Esc), then "See all results", which opens `/search?q=…`. `SearchPage` keeps the query in `?q=` (replacing the history entry while typing), shows results as `ArticleCard`s, and sets `noindex, follow`. Both render through `SearchResults`, which owns the too-short, loading, failed and no-match states.
- **Analytics.** `src/services/search/searchAnalytics.ts` sends GA4 `search` (`search_term`, `results_count`, `source`: `modal` or `page`) for a settled query: on Enter, on opening a result, or after a 1 s pause in typing. Terms are trimmed, lowercased, whitespace-collapsed and cut to 100 characters; a term is not sent twice in a row, and never when it looks like an email address or a number of seven digits or more. Opening a result also sends `select_content` with the post's slug. Like all analytics, nothing is sent outside production. The Privacy page says search terms are collected. Because `/search?q=…` keeps the raw query in the URL, the analytics wrapper (`src/services/analytics`) sends every event with a `page_location` stripped of `q`, Firebase's own page view (which would carry the full URL) is turned off, and `usePageViews` logs one page view per path rather than per keystroke.

### Tags

A tag is identified by its **name**, the only identifier every source shares. `Tag` links to `/article/tag/<encoded name>`, and `usePosts({ tag })` passes the name to every adapter. Matching is exact, so tags spelled differently in two places (`JavaScript` and `javascript`) are different tags.

- **Contentful** posts carry tags in two places:
  - Contentful tags (`contentfulMetadata.tags`), used by newer posts;
  - the legacy `tags` field (`Array<Symbol>`), used by older ones.

  The adapter shows both, de-duplicated, and filters on either: `tags_contains_some: [name]` OR the Contentful tag's ID. Contentful tags can only be filtered by ID, so `getTagId` (`packages/cms/src/contentful/client.ts`) looks the name up in the space's tag list, fetched once per function instance from the delivery REST API (`/tags`). The GraphQL API can't list tags. If the tag list can't be fetched, the source still filters the legacy field by name and marks the answer `partial`, so it isn't edge-cached.
- **Notion** filters `Tags` with `multi_select.contains` on the name. Most tags aren't Notion's, so `notionSource` first checks that the name is one of the `Tags` options, and answers with no posts without querying when it isn't.

### Content outside the seam

Every post listing reads through the seam. Authors, About and Social content exist only in Contentful and stay on Apollo, queried from the browser (`hooks/api/*` and the features that render them). Because of that, `VITE_CONTENTFUL_CMS_API_KEY` is still inlined into the bundle; moving these queries behind `api/` as well is what would remove it.

The About page's story section renders the Contentful `about` entry's `title` and `content` (Markdown). While it loads, or if the query fails or returns no `content`, the section shows its built-in heading and copy instead; a failed query is reported to Sentry, not shown.

## Forms

The contact form (`features/ContactForm`) and the newsletter signup (`features/NewsLetter/SubscribeForm`, on the home page, after articles and on the About page, shown only while the `newsletter` feature flag is on) POST JSON to Vercel Functions that call [Resend](https://resend.com/docs/api-reference) with `fetch`, so the API key stays on the server:

- `POST /api/contact` takes `{ name, email, subject?, message }` and emails it to `CONTACT_TO_EMAIL` (`POST /emails`), with `reply_to` set to the reader's address.
- `POST /api/subscribe` takes `{ email }` and adds it to the Resend audience `RESEND_AUDIENCE_ID` (`POST /audiences/{id}/contacts`). Resend has renamed audiences to segments and deprecated these endpoints; they still work. An address that is already subscribed gets the same answer as a new one, so the form never tells whether an address is on the list.

Both forms validate with react-hook-form and the zod schemas in `shared/forms.ts`, and the functions validate again with the same schemas. The schemas live in `shared/`, the contract between `api/` and `src/`: it has its own `tsconfig.json` because Vercel compiles every file a function imports with the nearest one and Node loads the result as CommonJS, and it is not under `api/` because the dev server proxies `/api/*` to `vercel dev`, so a source module requested from that path would never reach Vite. `src/` imports it as `@shared/*`; `api/` imports it relatively. The form shows its success message only after a 2xx answer; on any other answer it shows an error and keeps what the reader typed.

`createFormHandler` in `api/_forms/handler.ts` answers, in order: `405` to anything but `POST`, `503` while the form's environment variables are not all set (the function logs which are missing), `429` after 5 requests from one address in 10 minutes, `200` without sending anything when the hidden `website` honeypot field is filled (and a log line, so autofill that fills it shows up), `400` with `fieldErrors` when the schema rejects the body, `502` when Resend fails or takes over 10 seconds (Resend's answer goes to the function logs, not to the browser), and `200` once Resend accepts the form.

The rate limit is **best-effort**: it counts in the memory of one function instance, and Vercel runs and recycles several, so it slows down one client hammering an instance but is not a hard limit. Spam protection is the honeypot plus this rate limit; there is no CAPTCHA.

## Error handling and observability

- **Error boundaries:** a root `ErrorBoundary` in `main.tsx`, and a `RouteErrorBoundary` per route that reports the crash tagged with its `location` and renders `ErrorBoundary`'s fallback message.
- **Data errors:** pages render an inline message and call `captureException`. A single failing CMS source is reported but doesn't block rendering.
- **GraphQL errors:** `errorMiddleware` (Apollo `onError`) reports them to Sentry. It must sit *before* the terminating `HttpLink`; links after a terminating link never run.
- **Production gating:** Sentry, error capture and Firebase Analytics only run when `import.meta.env.MODE === 'production'`.
- **Lazy Firebase:** the Firebase SDK is downloaded with `import()` on the first event, and only when `VITE_FIREBASE_PROJECT_ID` is set, so a missing optional config cannot blank the app. Events logged while it loads are sent in order once it has.
- **Lazy Sentry:** `initializeMonitoring()` downloads the Sentry SDK with `import()` once the browser is idle (`requestIdleCallback`, at most 3 s), after the first paint. Errors reported through `captureException` or `captureAndLogError` before then are queued and sent once Sentry is initialized. Uncaught errors and unhandled rejections are queued too: `initializeMonitoring()` listens for `error` and `unhandledrejection` on `window` until `Sentry.init` has installed Sentry's own global handlers. Code reports through `@monitoring` only; importing `@sentry/*` anywhere else pulls the SDK back into the first bundle. Trade-offs: errors thrown while `main.tsx`'s imports evaluate, before it calls `initializeMonitoring()`, are not caught (as before lazy loading); early uncaught errors reach Sentry through `captureException`, so they are marked handled and come with an extra "Uncaught before monitoring loaded" message event; queued reports are lost if the reader leaves before Sentry loads; and nothing is reported if the Sentry chunk fails to download.
- **Chunk load errors:** routes, `NotFound` and the search dialog load with `lazy` from `@/lib/chunkReload`, not React's. After a deploy, a tab that is already open asks for chunk hashes that no longer exist, and only a reload fixes that, so when a lazy component's chunk fails, it reloads the page once and waits on Suspense meanwhile. A `sessionStorage` timestamp limits this to one reload a minute; past that, or offline, or with storage blocked, the error reaches the error boundary and Sentry as before. Plain `import()` calls (Sentry, Firebase, the search index) don't reload: their callers handle failure themselves.
- **Bundle budget:** `bun run check:bundle-size` (`scripts/bundle-budget.js`) fails the Build workflow when the entry chunk plus the chunks `index.html` preloads exceed 185 kB gzipped. Load a new SDK lazily rather than raising the budget.

## Configuration

All browser configuration is read in `src/config/`. Only `VITE_*` variables (plus Vite's `MODE`, `DEV`, `PROD`) exist there; `NODE_ENV` and other unprefixed names are always `undefined` in the browser. See `.env.sample` for the full list.

Each `VITE_*` value is read with `readEnv` (`src/config/runtimeEnv.ts`), which returns `window.__ENV__?.KEY ?? import.meta.env.KEY`. An inline `<script>` in `index.html`, before the app, sets `window.__ENV__` first: `window.__ENV__ = window.__ENV__ || {}; /*__RUNTIME_ENV__*/`. It is inline so that no host pays for an extra request before the first paint.

- **On Vercel**, nothing replaces the placeholder, so `window.__ENV__` stays empty and the app uses the values Vite inlined at build time.
- **In the Docker image**, the server reads `dist/index.html` once at startup and replaces the placeholder with the allowlisted `VITE_*` variables from the container's environment (`CLIENT_ENV_KEYS` and `injectEnv` in `server/envScript.ts`), never any other variable. `<` is escaped, so no value can close the script. The server refuses to start if the placeholder is missing. `server/envScript.spec.ts` checks that the placeholder survives `vite build`, and fails when the allowlist and the keys `src/config` reads differ, so add a new `VITE_*` key to both.
- **Firebase:** because `VITE_FIREBASE_PROJECT_ID` can now arrive at runtime, Rollup can no longer drop the Firebase chunks from a build made without it. They are still loaded only by `import()`, so they stay out of the initial bundle.

| Variable | Used by |
|---|---|
| `VITE_CONTENTFUL_CMS_*` | Contentful Apollo client in the browser (space, environment, delivery token, GraphQL URL), for authors, About and Social content. |
| `CONTENTFUL_CMS_API_KEY`, `CONTENTFUL_CMS_SPACE_ID`, `CONTENTFUL_CMS_ENVIRONMENT`, `CONTENTFUL_CMS_GRAPHQL_URL`, `CONTENTFUL_CMS_REST_API_URL` | **Server only**, read by `api/contentful`. The key and space ID are required; the other three default to `master`, `https://graphql.contentful.com` and `https://cdn.contentful.com`. |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_TRACES_SAMPLE_RATE` | Sentry (production only). |
| `VITE_FIREBASE_*` | Firebase Analytics (optional, production only). |
| `VITE_ENV`, `VITE_APP_NAME`, `VITE_APP_TITLE` | Environment label and site naming. |
| `VITE_FEATURES` | Feature flag overrides, a comma-separated list such as `newsletter=on,search=off`. See [Feature flags](#feature-flags). |
| `NOTION_API_KEY`, `NOTION_DATA_SOURCE_ID` (or `NOTION_DATABASE_ID`) | **Server only**, read by `api/notion`. Queries target a data source (Notion API 2025-09-03). `getDataSourceId()` in `packages/cms/src/notion/client.ts` uses `NOTION_DATA_SOURCE_ID` as is, or looks up the first data source of `NOTION_DATABASE_ID` once per function instance. |
| `SANITY_PROJECT_ID`, `SANITY_API_TOKEN`, `SANITY_DATASET` (default `production`), `SANITY_API_VERSION` (default `2025-02-19`) | **Server only**, read by `api/sanity`. The token (a Viewer token) is required: the datasets are private. Vercel's Preview environment reads `staging`, Production reads `production`. |
| `RESEND_API_KEY` | **Server only**, read by `api/contact` and `api/subscribe`. A Resend API key that can send emails and manage contacts. |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | **Server only**, read by `api/contact`. The address contact messages go to, and the sender they come from. The sender must be on a domain verified in Resend, and may include a name: `Journal <forms@example.com>`. |
| `RESEND_AUDIENCE_ID` | **Server only**, read by `api/subscribe`. The ID of the Resend audience (now called a segment) that newsletter subscribers join. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Build only, set in the Vercel project: `@sentry/vite-plugin` creates the Sentry release and uploads the source maps of the bundle Vercel deploys. Without them the plugin skips the upload. |

### Feature flags

Feature flags turn a feature on or off per environment without a code change. They ride on the same `readEnv` path as the rest of the configuration, so they are known before the first render: no extra request, no flicker, and nothing that can be down.

| Flag | Default | Gates |
|---|---|---|
| `newsletter` | off | The newsletter signup: `NewsLetterSection` on the home page, `NewsLetterCTA` after articles, and the "Join Our Community" section on the About page. |
| `search` | off | Site search (see [Search](#search)): the navbar search button and its shortcuts, and the `/search` page, which is not found while the flag is off. The dialog and the search index load with `lazy()` and `import()` on first use, the dialog inside its own `ErrorBoundary`, so a chunk that fails again after the one reload (see [Error handling and observability](#error-handling-and-observability)) drops the dialog, not the navbar. |
| `sanity` | off | Sanity as a post source, like `notion`: while it is off, `/api/sanity` is never called. Turn it on only once `SANITY_*` is set and the datasets are private. |
| `notion` | on | Notion as a post source. While it is off, `createApiAdapter('notion')` is not registered, so the site never calls `/api/notion` and Notion posts are neither listed nor found by slug. `api/notion` itself is not gated. |

**Setting flags.** `VITE_FEATURES` holds overrides as a comma-separated list, such as `newsletter=on,search=off`. A value is `on`/`off`, `true`/`false` or `1`/`0` (any case), and a bare name means on. A flag the list doesn't name keeps its default. An unknown name, an unknown value or a malformed entry is skipped, with a `console.warn` in development, so a typo never breaks the app. Flags are read once when the page loads.

- **Vercel:** set `VITE_FEATURES` in the project's environment variables, separately for Production and Preview, then redeploy. Vite inlines it at build time, so a change only takes effect with the next deployment.
- **Docker:** pass `-e VITE_FEATURES=...` (or put it in the `--env-file`) and restart the container. No rebuild is needed.
- **Locally:** set it in `.env.local` and restart `bun dev`.

**Reading a flag.** Wrap UI in `<Feature name="search" fallback={...}>` (`src/components/Feature`), which renders its children only while the flag is on, or call `useFeatureFlag('search')` (`src/hooks/features`). Code outside React imports the parsed flags from `src/config/features.ts` (`import features from '@/config/features'`), as `src/services/cms/adapters.ts` does. Names are checked by TypeScript, so a misspelt flag fails `bun run typecheck`.

Code behind a flag that is off still ships in the bundle, because the value can change at runtime in the Docker image. Load anything sizeable behind a flag with `lazy()` from `@/lib/chunkReload`, as `SearchLauncher` does for the search dialog, to keep it out of the initial bundle.

**Adding a flag.** Add it to `FEATURE_DEFAULTS` in `src/config/features.ts`, which is the only place flags are declared. A new or unfinished feature defaults to `false`, so an environment without `VITE_FEATURES` hides it. Gate the feature with `<Feature>`, `useFeatureFlag` or `features.<name>`. Test both states: render under `<FeaturesProvider value={{ ...FEATURE_DEFAULTS, <name>: true }}>` (`src/providers/features`), or set `window.__ENV__ = { VITE_FEATURES: '...' }` and reload the module for code outside React (`src/services/cms/adapters.spec.ts`). Add the flag to the table above. `VITE_FEATURES` is already in `CLIENT_ENV_KEYS`, so no server change is needed.

**Removing a flag.** Once a feature has been on in production for a release and isn't expected to be turned off again, delete it from `FEATURE_DEFAULTS`, unwrap its `<Feature>` (or remove its check), delete the code for the off state and its tests, and drop it from the table above and from any `VITE_FEATURES` values. A name left in `VITE_FEATURES` after its flag is gone is ignored with a development warning. Flags meant as lasting switches (`notion`) stay.

## apps/sites

`apps/sites` is one Astro app (`output: 'server'`) that serves `brianlusina.com` (the `home` site) and `folio.brianlusina.com` (`folio`). The blog stays in `apps/blog`. Paths in this section are relative to `apps/sites/`. Run it with `bun run dev:sites` from the root, and build it with `bun run build:sites`.

- **Registry:** `sites.config.json` names every host per environment (`production`, `staging`, `development`) and the redirect hosts (`www.brianlusina.com` → `brianlusina.com`). The `SITES_CONFIG` environment variable, a JSON string with the same shape, replaces the file. `src/sites/registry.ts` validates it when the server starts, and an invalid one throws `Invalid SITES_CONFIG`. Hosts are compared lowercased, without a trailing dot or a default port.
- **Resolution** (`src/sites/resolve.ts`), in this order:
  1. a redirect host answers 301 to its target, with the same path and query;
  2. the internal prefixes (`/home/...`, `/folio/...`) are a 404 everywhere, so each page has one URL;
  3. a production hostname always serves its own site;
  4. any other registered host serves its site, unless an override applies;
  5. an unregistered host outside production (a Vercel preview URL) serves the override, or a landing page that links each site;
  6. anything else is a 404.
- **Override:** outside production, `?site=home|folio` picks the site and sets an `HttpOnly` `site` cookie, so later links keep it. The cookie applies when there's no query. Vercel gives one preview URL per deployment, not one per site, so this is how a preview shows both. A production hostname refuses the override even when `VERCEL_ENV` is unset (a self-hosted production), so nobody can make `brianlusina.com` serve folio.
- **Middleware** (`src/middleware.ts`): it rewrites the request to `src/pages/<site>/...` and sets `locals.site`. Astro runs the middleware again for the rewritten request, and `locals.rewritten` lets that pass through.
- **Caching:** production pages get `Cache-Control: s-maxage=300, stale-while-revalidate=86400`; the CDN's cache key includes the host. Everywhere else the override cookie can change any page, so those responses (staging, local and preview pages, override and landing) are `private, no-store` with `Vary: Cookie`, since a cached copy could serve the wrong site. There's no ISR yet: the pages are placeholders with nothing to revalidate. It comes with content.
- **SEO:** canonical URLs always name the production host (`canonicalUrl` in `src/sites/urls.ts`). Each site has its own `robots.txt`, which is open in production and `Disallow: /` elsewhere (a preview's landing answers `/robots.txt` closed, since crawlers send no cookie), and its own `sitemap.xml` built from `src/sites/routes.ts`. Outside production, every response carries `X-Robots-Tag: noindex`.
- **Links between sites:** `siteUrl` builds them per environment. On a preview, a link to a site is the same origin with `?site=`, and a link to the blog goes to staging.
- **Styling:** Tailwind 3 through PostCSS with the `@brianlusina/ui` preset. The layout inlines `themeScript`, so the theme matches the blog's before first paint.
- **Adapter seam:** `astro.config.mjs` names the adapter on one line (`const adapter = vercel()`). Self-hosting changes that line to `@astrojs/node`; nothing else depends on Vercel.

## Deployment topology

- The SPA is static (`dist/`). Posts from both CMSs and the contact and newsletter forms **require** a host that runs the `api/` functions: Vercel, which builds every PR as a preview, or the Docker image.
- Production deploys through the Vercel GitHub integration, with the project's Root Directory set to `apps/blog`. GitHub Actions does only what Vercel doesn't on pushes to `staging` and `production`: semantic-release tags (`release.yml`) and the Docker image (`dockerimage.yml`), pushed to `ghcr.io/<owner>/journal` and tagged with the branch and the commit SHA. The Sentry release and source maps come from Vercel's own build (see `SENTRY_*` above), so they match the deployed bundle.
- The **Docker image** runs the whole app, `api/` included, on Bun (`server/index.ts`), for hosts with a container runtime:
  - **Static files:** `dist/`, with `index.html` for any other path (the SPA's routes). Files directly in `/assets/`, which Vite content-hashes, are cached for a year (`scripts/repo-policy.spec.ts` keeps unhashed files out of the top of `public/assets/`); `index.html` (with the configuration set) is `no-cache`. A missing `/assets/*` file is a 404, not `index.html`.
  - **Functions:** `/api/...` runs the matching file in `api/` by Vercel's file-system rules: `api/notion/posts.ts` serves `/api/notion/posts`, `api/notion/posts/[slug].ts` serves `/api/notion/posts/:slug`, `api/a/index.ts` serves `/api/a`, and files and directories starting with `_` (such as `api/_forms/`) are not routes. An unknown `/api` path is a JSON 404, and a function that fails to load or throws a JSON 500. `server/adapter.ts` passes a handler the part of `VercelRequest` and `VercelResponse` the functions use: `req.method`, `req.query` (with the dynamic segments), `req.headers`, `req.body` (parsed when it is JSON), `req.socket.remoteAddress` (the client's address), and `res.status`, `res.setHeader`, `res.json`, `res.send` and `res.end`. A function that needs more must have it added there.
  - **Build:** `bun apps/blog/server/build.ts` (from the root) bundles the server and each function, with the packages they import, into `dist-server/`, so the image has no `node_modules`.
  - **Configuration** comes from the container's environment when it starts: the `VITE_*` variables (set in `index.html`, see [Configuration](#configuration)) and the server-only ones (`CONTENTFUL_CMS_*`, `NOTION_*`, `SANITY_*`, `RESEND_*` and `CONTACT_*`). The image is built without build arguments, so one image runs in every environment. `PORT` changes the port (default 8080). Run it behind a proxy that overwrites `X-Forwarded-For`: the form functions rate-limit by the address in that header when it is set, so a client could otherwise send a new one with each request.
  - **Health:** `/healthz` answers `ok`, and the Dockerfile's `HEALTHCHECK` polls it.
- **Sanity Studio** (`studio/`) is hosted by Sanity. `ci_sanity_studio.yml` type-checks and builds it, and checks `schema.json` is current, on every push. It deploys only from `staging` and `production`. A hosted Studio's dataset is fixed when it's built, so each of those branches deploys its own Studio, from the GitHub Environment named after it, against the dataset of the same name, and `sanity deploy` uploads that branch's schema to that dataset. GitHub fills anything an Environment lacks from repository-level values, so the deploy reads its app ID, hostname and token only from Environment-only secrets (`STUDIO_DEPLOY_APP_ID`, `STUDIO_DEPLOY_HOSTNAME`, `STUDIO_DEPLOY_TOKEN`, never set at repository level), refuses to run when any is missing, and refuses unless the Environment's `SANITY_STUDIO_DATASET` is the branch name.
- A static-only host (GitHub Pages) serves the app without any posts: the aggregator degrades gracefully, but both sources fail, and the forms show their error message. Only the Apollo-queried authors, About and Social content appears.
- `bun dev` does not run `api/`, but proxies `/api/*` to `vercel dev` on port 3000 (`API_PROXY_TARGET` overrides it). Run both to work on posts or the forms locally (BrianLusina/journal#802).

## Testing

- **Runner:** Vitest with jsdom and React Testing Library 16; specs sit next to their code as `*.spec.ts(x)`.
- **React 18 root:** Testing Library renders on React 18's concurrent root, as the app does. Hooks are tested with its `renderHook`, and `user-event` 14 calls are awaited (`const user = userEvent.setup(); await user.click(...)`). `scripts/ts/setupTests.ts` makes the legacy-root `ReactDOM.render` and `ReactDOM.hydrate` throw, so a test or library that still renders through them (and so runs the tree as React 17) fails.
- **Command:** run with `bun run test` (Vitest). **Not** `bun test`, which runs Bun's own runner without `vitest.config.mts` and fails. Mocks reset before each test (`mockReset`).
- **Coverage gate:** `bun run test:coverage` enforces 85% lines and statements.
- **What to test where:**
  - Multi-source behaviour goes in `aggregator.spec.ts`, with fake adapters.
  - Per-CMS mapping goes in adapter specs (`fetch` mocked); the `api/` functions have their own specs (the CMS client or `fetch` mocked).
  - Hooks are tested against a mocked aggregator.
  - Pages and features are tested against mocked hooks.
- **CI:** GitHub Actions runs tests with coverage, ESLint and stylelint, and a production build on every push. All use bun with the committed text lockfile `bun.lock`. Dependabot updates it through the `bun` ecosystem.
- **Type-checking:** `vite build` and Vitest only transpile, so neither catches type errors. The Tests workflow runs `bun run typecheck` (`tsc -p tsconfig.app.json --noEmit`, all of `src/` including specs and stories) and fails on any error; `scripts/repo-policy.spec.ts` keeps that step in place. `tsconfig.app.json` is not `strict` yet, so `tsc` misses what only strict checks catch, such as `undefined` passed where a value is required, or story args set through `Template.bind({})` (typed `any` without `strictBindCallApply`). The Vercel functions in `api/` (not their specs) are type-checked by the Lint workflow (`bun run typecheck:api`), and `scripts/api-functions.spec.ts` checks that the config Vercel compiles each one with emits CommonJS. The Lint workflow also type-checks the Docker image's server (`bun run typecheck:server`, with `server/tsconfig.json`). `server/index.spec.ts` starts that server with Bun (so `bun` must be on the `PATH` for Vitest) over a small `dist/` and `api/` of its own.
- **End-to-end (Playwright):** `e2e/` at the repository root, outside Vitest's `include` globs (`scripts/repo-policy.spec.ts` keeps it that way). It proves blog.brianlusina.com behaves the same on every deployment, the gate for the monorepo work in #924.
  - **Projects:** `lib` unit-tests the pure helpers in `e2e/lib/` without a browser; `setup` checks that `E2E_BASE_URL` (required) serves the journal and not a login wall; `blog` depends on it and runs `e2e/blog/` in Chromium, so a wrong URL or a missing bypass secret is one clear failure. `e2e/blog/harness.spec.ts` checks the error checks themselves.
  - **Tags:** `@smoke` (every route, the 404 paths, the search flag, and the article inventory: every recorded article still opens with the same heading and is still listed on `/articles`), `@visual` (home, an article and About, light and dark, 1440 and 390 wide), `@a11y` (no axe rule beyond the recorded ones per route) and `@record` (rewrites the baselines; only with `E2E_RECORD=1`).
  - **Baselines:** `e2e/baseline/blog-articles.json` and `blog-axe.json` are recorded from a live deployment; screenshots live in `e2e/blog/__screenshots__/` and are only generated and compared in CI's `mcr.microsoft.com/playwright:v1.65.0-noble` container, since fonts render differently per OS (locally they are skipped). To update them, add the **`update-baselines`** label to a PR: `e2e-update-baselines.yml` records them from that PR's Vercel preview and commits them. That commit is pushed with `GITHUB_TOKEN`, which doesn't start the Tests and Lint workflows, so push a later commit before merging.
  - **What fails a test:** console errors, uncaught exceptions and failed requests from the deployment itself (requests the page cancels don't count). Third-party failures (analytics, image CDNs) are ignored. Expected failures (each CMS answering 404 for a slug it doesn't have) and known production defects (`KNOWN_DEFECTS`, each naming its issue) are listed in `e2e/lib/errors.ts`; `/authors` is marked `test.fail` until #946 is fixed.
  - **Sites projects:** `home` and `folio` run `e2e/home/` and `e2e/folio/`. On any host outside production (a preview, staging, or a local server), `e2e/sites/fixtures.ts` sets the `site` cookie so the page serves the site under test; production hosts refuse it, so it isn't sent there.
  - **CI:** `e2e.yml` runs on every successful Vercel `deployment_status` (previews, staging, production) against the deployment's URL, and runs `@smoke` against the production blog every 30 minutes. Vercel names a deployment's environment `<Preview|Production> – <project>` once more than one project deploys the repository, and just `Preview` or `Production` before that. `e2e/lib/projects.ts` maps it to the Playwright projects: `lib`, `setup` and `blog` for `journal` or a bare name; `lib`, `home` and `folio` for `yggdrasil` (apps/sites). An unknown name fails the run. `workflow_dispatch` tests any URL; its `environment` input (default `journal`) picks the projects.
  - **Protected previews:** set the GitHub Actions secrets `VERCEL_AUTOMATION_BYPASS_SECRET` (journal) and `VERCEL_AUTOMATION_BYPASS_SECRET_SITES` (yggdrasil), from each project's Vercel → Settings → Deployment Protection → Protection Bypass for Automation. A sites run never falls back to the journal's secret. The tests send it only to the deployment's own origin, never to third-party hosts.
  - **Locally:** `E2E_BASE_URL=https://blog.brianlusina.com bun run e2e`, or point it at `vercel dev`. `PW_CHROMIUM_PATH` overrides the browser binary, and `HTTPS_PROXY` is honoured.

## Known limits and follow-ups

| Area | Issue |
|---|---|
| A Sanity edit shows after up to about 6 minutes (the posts routes' edge cache); there is no revalidation webhook yet | P9 (the revalidate endpoint) |
| Posts don't load under `vite dev` (Notion and Contentful both need `api/`) | BrianLusina/journal#802 |
| The forms' rate limit is per function instance, and there is no CAPTCHA (see [Forms](#forms)) | Follow-up to BrianLusina/journal#826 |
