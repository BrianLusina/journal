# Architecture

This document describes how the journal site is put together: where content comes from, how it flows to the page, and the decisions and known limits behind that design. For setup and commands, see the [README](../README.md).

## Overview

The site is a client-rendered React 18 single-page app built with Vite. Posts can come from more than one content management system (CMS): today **Contentful** and **Notion**, both read through serverless functions in `api/` so their tokens stay on the server. Contentful content that is not a post (authors, About, Social) is still queried from the browser.

```text
                   Browser (React SPA)                              Server (Vercel Functions)
┌──────────────────────────────────────────────────────────┐     ┌──────────────────────────────┐
│ pages/ & features/                                       │     │ api/contentful/posts.ts      │
│   │ usePosts / usePost (hooks/cms)                       │     │ api/contentful/posts/[slug].ts│
│   ▼                                                      │     │   │ fetch                    │
│ services/cms/aggregator ── merge, sort, page, find       │     │   ▼                          │
│   │ over cmsAdapters (services/cms/adapters)             │     │ Contentful GraphQL + REST    │
│   ├── ContentfulAdapter ── fetch('/api/contentful/…') ───────────▶                             │
│   │                                                      │     │                              │
│   │                                                      │     │ api/notion/posts.ts          │
│   │                                                      │     │ api/notion/posts/[slug].ts   │
│   └── NotionAdapter ───── fetch('/api/notion/…') ──────────────▶   │ @notionhq/client         │
│                                                          │     │   │ notion-to-md (body)      │
│                                                          │     │   ▼                          │
│                                                          │     │ Notion API                   │
└──────────────────────────────────────────────────────────┘     └──────────────────────────────┘
```

Authors, About and Social content bypasses `api/`: `hooks/api/*` and the features that render it query the Contentful GraphQL API directly from the browser with Apollo.

## Source layout

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
| `src/services/cms/` | The multi-CMS seam: `CMSAdapter` interface, adapters, adapter registry, aggregator. |
| `src/services/monitoring/`, `src/services/analytics/` | Sentry and Firebase Analytics wrappers. Both are no-ops outside production. |
| `src/integrations/contentful/` | The Contentful Apollo client instance, plus the queries and fragments for authors, About and Social content. Post queries live in `api/contentful/_shared.ts`. |
| `src/clients/graphql/` | Apollo client factory and links (auth, retry, error reporting, HTTP). |
| `src/config/` | Typed access to the `VITE_*` configuration through `readEnv` (see [Configuration](#configuration)). |
| `src/types/` | Ambient types: the unified post model (`cms.d.ts`) and Contentful GraphQL shapes (`gql/`). |
| `api/contentful/`, `api/notion/` | Vercel Functions that hold the CMS credentials. `api/_routes.ts` has what both share: the method check, `limit` and query-parameter parsing, and the cache header. They compile with `api/tsconfig.json` (CommonJS, Node resolution), not the root Vite config: Node loads them as CommonJS because `package.json` has no `"type": "module"`. |
| `server/` | The Docker image's Bun server. It serves `dist/`, runs the `api/` functions through a Vercel adapter and sets the runtime configuration in `index.html`. Vercel doesn't use it. |
| `api/contact.ts`, `api/subscribe.ts`, `api/_forms/` | Vercel Functions behind the contact form and the newsletter signup (see [Forms](#forms)). `api/_forms/schemas.ts` holds the zod schemas that the forms in `src/` import too. |

### Path aliases

`tsconfig.app.json` is the **single source of truth** for import aliases (`@hooks`, `@cmsService`, `@/…`, and so on).

- Vite reads it through `vite-tsconfig-paths` (`vite.config.mts`).
- Jest generates its `moduleNameMapper` from it (`jest.config.js`).

Add new aliases there only. Before this was consolidated, three hand-copied lists drifted apart and broke most of the test suite.

## The CMS seam

### Unified model

Every source maps its content onto `UnifiedPost` (`src/types/cms.d.ts`): `id`, `source`, `title`, `slug`, `publishDate`, `tags: string[]`, `authors: UnifiedAuthor[]`, and optional `subtitle`, `description`, `category`, `body` (Markdown), `heroImage`, `thumbnail`. UI code that renders posts should depend on this model only, never on a CMS's own types.

`UnifiedAuthor` (`id`, `source`, `name`, `avatarUrl`, `shortBio`) carries everything `AuthorBadge` displays, so authors are never fetched again per badge. An author's `id` is only meaningful within its `source`; only Contentful authors link to the authors page. A Notion post has at most one author, named by its `Authors` text property (typed, or a mention of a workspace member), and no avatar. Notion gives a mentioned member's name only when the integration has the **Read user information** capability; without it, type the name instead of mentioning.

### Adapters

```ts
interface CMSAdapter {
  readonly source: CMSSource;
  // Next page of posts, newest first by publish date. Pass the previous page's nextCursor.
  getPosts(request: { cursor?: string; limit: number; category?: string; tag?: string }): Promise<{ items: UnifiedPost[]; nextCursor: string | null }>;
  getPostBySlug(slug: string): Promise<UnifiedPost | null>;
}
```

- **`ContentfulAdapter`** calls `/api/contentful/posts` and `/api/contentful/posts/:slug`, and maps `BlogPostItem` to `UnifiedPost`. The functions query the Contentful GraphQL API with the delivery token, ordered by `publishDate_DESC`, and answer `{ results, nextCursor }` (the slug route answers `{ post }`). The cursor is the offset of the next post. Listings only include posts that have a `publishDate`, the key the feed merges on.
- **`NotionAdapter`** calls `/api/notion/posts` and `/api/notion/posts/:slug`, and maps the page properties listed under [Notion schema](#notion-schema). The `[slug]` function converts the page body to Markdown with `notion-to-md`, so both sources produce Markdown for `ArticlePage`. Its cursor is Notion's own `next_cursor`, passed through `/api/notion/posts?cursor=…`; each request reads one Notion page (at most 100 posts), so there is no limit on how far the feed can go. A Notion page is **published** when its `Status` is `Published` **and** `Published` (the date) is set (the feed merges on publish date, so an undated post has no place in it). It is listed only when it is published and its `Slug` is not empty (a post without a slug could never be opened), and opened by slug only when it is published.

#### Notion schema

The routes and the adapter read the 📰 Journal CMS data source, whose properties mirror the Contentful blog post fields. Every property name lives in `api/notion/_schema.ts`, shared by both routes and `NotionAdapter`. Notion matches names exactly, case included, and rejects a whole query (the routes then answer 502) when a filter or sort names a property it doesn't have or uses the wrong type. **A rename or type change in the database needs the same change in `_schema.ts`, `NotionAdapter` and this table.**

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

`src/services/cms/adapters.ts` is the registry: an ordered array of adapter instances. Array order is priority order when two sources publish the same slug. Notion is registered only while the `notion` feature flag is on (see `VITE_FEATURES`); while it is off, the site never calls `/api/notion`, and Notion posts are neither listed nor found by slug.

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
3. If the source needs a secret, put the calls behind a function in `api/` (as Contentful and Notion do), using the helpers in `api/_routes.ts`. Never use a `VITE_`-prefixed variable for a secret, because Vite inlines those into the browser bundle.
4. Register an instance in `src/services/cms/adapters.ts`.
5. Add `<Name>Adapter.spec.ts` covering mapping, fallbacks, pagination and not-found. `ContentfulAdapter.spec.ts` and `NotionAdapter.spec.ts` show the pattern; the functions get specs next to them (`api/contentful/_handlers.spec.ts`).

No hook, page or aggregator change is needed.

### Tags

A tag is identified by its **name**, the only identifier every source shares. `Tag` links to `/article/tag/<encoded name>`, and `usePosts({ tag })` passes the name to every adapter. Matching is exact, so tags spelled differently in two places (`JavaScript` and `javascript`) are different tags.

- **Contentful** posts carry tags in two places:
  - Contentful tags (`contentfulMetadata.tags`), used by newer posts;
  - the legacy `tags` field (`Array<Symbol>`), used by older ones.

  The adapter shows both, de-duplicated, and filters on either: `tags_contains_some: [name]` OR the Contentful tag's ID. Contentful tags can only be filtered by ID, so `getTagId` (`api/contentful/_shared.ts`) looks the name up in the space's tag list, fetched once per function instance from the delivery REST API (`/tags`). The GraphQL API can't list tags. If the tag list can't be fetched, the function still filters the legacy field by name.
- **Notion** filters `Tags` with `multi_select.contains` on the name. Most tags aren't Notion's, so `/api/notion/posts?tag=` first checks that the name is one of the `Tags` options, and answers with no posts without querying when it isn't.

### Content outside the seam

Every post listing reads through the seam. Authors, About and Social content exist only in Contentful and stay on Apollo, queried from the browser (`hooks/api/*` and the features that render them). Because of that, `VITE_CONTENTFUL_CMS_API_KEY` is still inlined into the bundle; moving these queries behind `api/` as well is what would remove it.

The About page's story section renders the Contentful `about` entry's `title` and `content` (Markdown). While it loads, or if the query fails or returns no `content`, the section shows its built-in heading and copy instead; a failed query is reported to Sentry, not shown.

## Forms

The contact form (`features/ContactForm`) and the newsletter signup (`features/NewsLetter/SubscribeForm`, on the home page, after articles and on the About page, shown only while the `newsletter` feature flag is on) POST JSON to Vercel Functions that call [Resend](https://resend.com/docs/api-reference) with `fetch`, so the API key stays on the server:

- `POST /api/contact` takes `{ name, email, subject?, message }` and emails it to `CONTACT_TO_EMAIL` (`POST /emails`), with `reply_to` set to the reader's address.
- `POST /api/subscribe` takes `{ email }` and adds it to the Resend audience `RESEND_AUDIENCE_ID` (`POST /audiences/{id}/contacts`). Resend has renamed audiences to segments and deprecated these endpoints; they still work. An address that is already subscribed gets the same answer as a new one, so the form never tells whether an address is on the list.

Both forms validate with react-hook-form and the zod schemas in `api/_forms/schemas.ts`, and the functions validate again with the same schemas. The schemas live under `api/` because Vercel compiles every file a function imports with the nearest `tsconfig.json`, and only `api/tsconfig.json` emits the CommonJS Node loads; the browser bundle imports them from there. The form shows its success message only after a 2xx answer; on any other answer it shows an error and keeps what the reader typed.

`createFormHandler` in `api/_forms/handler.ts` answers, in order: `405` to anything but `POST`, `503` while the form's environment variables are not all set (the function logs which are missing), `429` after 5 requests from one address in 10 minutes, `200` without sending anything when the hidden `website` honeypot field is filled (and a log line, so autofill that fills it shows up), `400` with `fieldErrors` when the schema rejects the body, `502` when Resend fails or takes over 10 seconds (Resend's answer goes to the function logs, not to the browser), and `200` once Resend accepts the form.

The rate limit is **best-effort**: it counts in the memory of one function instance, and Vercel runs and recycles several, so it slows down one client hammering an instance but is not a hard limit. Spam protection is the honeypot plus this rate limit; there is no CAPTCHA.

## Error handling and observability

- **Error boundaries:** a root `ErrorBoundary` in `main.tsx`, and a `RouteErrorBoundary` per route that reports the crash tagged with its `location` and renders `ErrorBoundary`'s fallback message.
- **Data errors:** pages render an inline message and call `captureException`. A single failing CMS source is reported but doesn't block rendering.
- **GraphQL errors:** `errorMiddleware` (Apollo `onError`) reports them to Sentry. It must sit *before* the terminating `HttpLink`; links after a terminating link never run.
- **Production gating:** Sentry, error capture and Firebase Analytics only run when `import.meta.env.MODE === 'production'`.
- **Lazy Firebase:** the Firebase SDK is downloaded with `import()` on the first event, and only when `VITE_FIREBASE_PROJECT_ID` is set, so a missing optional config cannot blank the app. Events logged while it loads are sent in order once it has.
- **Lazy Sentry:** `initializeMonitoring()` downloads the Sentry SDK with `import()` once the browser is idle (`requestIdleCallback`, at most 3 s), after the first paint. Errors reported through `captureException` or `captureAndLogError` before then are queued and sent once Sentry is initialized. Uncaught errors and unhandled rejections are queued too: `initializeMonitoring()` listens for `error` and `unhandledrejection` on `window` until `Sentry.init` has installed Sentry's own global handlers. Code reports through `@monitoring` only; importing `@sentry/*` anywhere else pulls the SDK back into the first bundle. Trade-offs: errors thrown while `main.tsx`'s imports evaluate, before it calls `initializeMonitoring()`, are not caught (as before lazy loading); early uncaught errors reach Sentry through `captureException`, so they are marked handled and come with an extra "Uncaught before monitoring loaded" message event; queued reports are lost if the reader leaves before Sentry loads; and nothing is reported if the Sentry chunk fails to download.
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
| `NOTION_API_KEY`, `NOTION_DATA_SOURCE_ID` (or `NOTION_DATABASE_ID`) | **Server only**, read by `api/notion`. Queries target a data source (Notion API 2025-09-03). `getDataSourceId()` in `api/notion/_shared.ts` uses `NOTION_DATA_SOURCE_ID` as is, or looks up the first data source of `NOTION_DATABASE_ID` once per function instance. |
| `RESEND_API_KEY` | **Server only**, read by `api/contact` and `api/subscribe`. A Resend API key that can send emails and manage contacts. |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | **Server only**, read by `api/contact`. The address contact messages go to, and the sender they come from. The sender must be on a domain verified in Resend, and may include a name: `Journal <forms@example.com>`. |
| `RESEND_AUDIENCE_ID` | **Server only**, read by `api/subscribe`. The ID of the Resend audience (now called a segment) that newsletter subscribers join. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Build only, set in the Vercel project: `@sentry/vite-plugin` creates the Sentry release and uploads the source maps of the bundle Vercel deploys. Without them the plugin skips the upload. |

### Feature flags

Feature flags turn a feature on or off per environment without a code change. They ride on the same `readEnv` path as the rest of the configuration, so they are known before the first render: no extra request, no flicker, and nothing that can be down.

| Flag | Default | Gates |
|---|---|---|
| `newsletter` | off | The newsletter signup: `NewsLetterSection` on the home page, `NewsLetterCTA` after articles, and the "Join Our Community" section on the About page. |
| `search` | off | The search menu in `MainLayout`. `Menu` and `Search` are loaded with `lazy()` only while it is on, inside their own `ErrorBoundary`, so a failed chunk drops the menu, not the page. The search itself is still a stub. |
| `notion` | on | Notion as a post source. While it is off, `NotionAdapter` is not registered, so the site never calls `/api/notion` and Notion posts are neither listed nor found by slug. `api/notion` itself is not gated. |

**Setting flags.** `VITE_FEATURES` holds overrides as a comma-separated list, such as `newsletter=on,search=off`. A value is `on`/`off`, `true`/`false` or `1`/`0` (any case), and a bare name means on. A flag the list doesn't name keeps its default. An unknown name, an unknown value or a malformed entry is skipped, with a `console.warn` in development, so a typo never breaks the app. Flags are read once when the page loads.

- **Vercel:** set `VITE_FEATURES` in the project's environment variables, separately for Production and Preview, then redeploy. Vite inlines it at build time, so a change only takes effect with the next deployment.
- **Docker:** pass `-e VITE_FEATURES=...` (or put it in the `--env-file`) and restart the container. No rebuild is needed.
- **Locally:** set it in `.env.local` and restart `bun dev`.

**Reading a flag.** Wrap UI in `<Feature name="search" fallback={...}>` (`src/components/Feature`), which renders its children only while the flag is on, or call `useFeatureFlag('search')` (`src/hooks/features`). Code outside React imports the parsed flags from `src/config/features.ts` (`import features from '@/config/features'`), as `src/services/cms/adapters.ts` does. Names are checked by TypeScript, so a misspelt flag fails `bun run typecheck`.

Code behind a flag that is off still ships in the bundle, because the value can change at runtime in the Docker image. Load anything sizeable behind a flag with `lazy()`, as `MainLayout` does for search, to keep it out of the initial bundle.

**Adding a flag.** Add it to `FEATURE_DEFAULTS` in `src/config/features.ts`, which is the only place flags are declared. A new or unfinished feature defaults to `false`, so an environment without `VITE_FEATURES` hides it. Gate the feature with `<Feature>`, `useFeatureFlag` or `features.<name>`. Test both states: render under `<FeaturesProvider value={{ ...FEATURE_DEFAULTS, <name>: true }}>` (`src/providers/features`), or set `window.__ENV__ = { VITE_FEATURES: '...' }` and reload the module for code outside React (`src/services/cms/adapters.spec.ts`). Add the flag to the table above. `VITE_FEATURES` is already in `CLIENT_ENV_KEYS`, so no server change is needed.

**Removing a flag.** Once a feature has been on in production for a release and isn't expected to be turned off again, delete it from `FEATURE_DEFAULTS`, unwrap its `<Feature>` (or remove its check), delete the code for the off state and its tests, and drop it from the table above and from any `VITE_FEATURES` values. A name left in `VITE_FEATURES` after its flag is gone is ignored with a development warning. Flags meant as lasting switches (`notion`) stay.

## Deployment topology

- The SPA is static (`dist/`). Posts from both CMSs and the contact and newsletter forms **require** a host that runs the `api/` functions: Vercel, which builds every PR as a preview, or the Docker image.
- Production deploys through the Vercel GitHub integration. GitHub Actions does only what Vercel doesn't on pushes to `staging` and `production`: semantic-release tags (`release.yml`) and the Docker image (`dockerimage.yml`), pushed to `ghcr.io/<owner>/journal` and tagged with the branch and the commit SHA. The Sentry release and source maps come from Vercel's own build (see `SENTRY_*` above), so they match the deployed bundle.
- The **Docker image** runs the whole app, `api/` included, on Bun (`server/index.ts`), for hosts with a container runtime:
  - **Static files:** `dist/`, with `index.html` for any other path (the SPA's routes). Files directly in `/assets/`, which Vite content-hashes, are cached for a year (`scripts/repo-policy.spec.ts` keeps unhashed files out of the top of `public/assets/`); `index.html` (with the configuration set) is `no-cache`. A missing `/assets/*` file is a 404, not `index.html`.
  - **Functions:** `/api/...` runs the matching file in `api/` by Vercel's file-system rules: `api/notion/posts.ts` serves `/api/notion/posts`, `api/notion/posts/[slug].ts` serves `/api/notion/posts/:slug`, `api/a/index.ts` serves `/api/a`, and files and directories starting with `_` (such as `api/_forms/`) are not routes. An unknown `/api` path is a JSON 404, and a function that fails to load or throws a JSON 500. `server/adapter.ts` passes a handler the part of `VercelRequest` and `VercelResponse` the functions use: `req.method`, `req.query` (with the dynamic segments), `req.headers`, `req.body` (parsed when it is JSON), `req.socket.remoteAddress` (the client's address), and `res.status`, `res.setHeader`, `res.json`, `res.send` and `res.end`. A function that needs more must have it added there.
  - **Build:** `bun server/build.ts` bundles the server and each function, with the packages they import, into `dist-server/`, so the image has no `node_modules`.
  - **Configuration** comes from the container's environment when it starts: the `VITE_*` variables (set in `index.html`, see [Configuration](#configuration)) and the server-only ones (`CONTENTFUL_CMS_*`, `NOTION_*`, `RESEND_*` and `CONTACT_*`). The image is built without build arguments, so one image runs in every environment. `PORT` changes the port (default 8080). Run it behind a proxy that overwrites `X-Forwarded-For`: the form functions rate-limit by the address in that header when it is set, so a client could otherwise send a new one with each request.
  - **Health:** `/healthz` answers `ok`, and the Dockerfile's `HEALTHCHECK` polls it.
- A static-only host (GitHub Pages) serves the app without any posts: the aggregator degrades gracefully, but both sources fail, and the forms show their error message. Only the Apollo-queried authors, About and Social content appears.
- `vite dev` does not run `api/`. Use `vercel dev` to work on posts or the forms locally (BrianLusina/journal#802).

## Testing

- **Runner:** Jest 26 with jsdom and React Testing Library 16; specs sit next to their code as `*.spec.ts(x)`.
- **React 18 root:** Testing Library renders on React 18's concurrent root, as the app does. Hooks are tested with its `renderHook`, and `user-event` 14 calls are awaited (`const user = userEvent.setup(); await user.click(...)`). `scripts/ts/setupTests.ts` makes the legacy-root `ReactDOM.render` and `ReactDOM.hydrate` throw, so a test or library that still renders through them (and so runs the tree as React 17) fails.
- **Command:** run with `bun run test` (Jest). **Not** `bun test`, which runs Bun's own runner without `jest.config.js` and fails.
- **Coverage gate:** `bun run test:coverage` enforces 85% lines and statements.
- **What to test where:**
  - Multi-source behaviour goes in `aggregator.spec.ts`, with fake adapters.
  - Per-CMS mapping goes in adapter specs (`fetch` mocked); the `api/` functions have their own specs (the CMS client or `fetch` mocked).
  - Hooks are tested against a mocked aggregator.
  - Pages and features are tested against mocked hooks.
- **CI:** GitHub Actions runs tests with coverage, ESLint and stylelint, and a production build on every push. All use bun with the committed text lockfile `bun.lock`. Dependabot updates it through the `bun` ecosystem.
- **Type-checking:** `vite build` and Jest only transpile, so neither catches type errors. The Tests workflow runs `bun run typecheck` (`tsc -p tsconfig.app.json --noEmit`, all of `src/` including specs and stories) and fails on any error; `scripts/repo-policy.spec.ts` keeps that step in place. `tsconfig.app.json` is not `strict` yet, so `tsc` misses what only strict checks catch, such as `undefined` passed where a value is required, or story args set through `Template.bind({})` (typed `any` without `strictBindCallApply`). The Vercel functions in `api/` (not their specs) are type-checked by the Lint workflow (`bun run typecheck:api`), and `scripts/api-functions.spec.ts` checks that the config Vercel compiles each one with emits CommonJS. The Lint workflow also type-checks the Docker image's server (`bun run typecheck:server`, with `server/tsconfig.json`). `server/index.spec.ts` starts that server with Bun (so `bun` must be on the `PATH` for Jest) over a small `dist/` and `api/` of its own.

## Known limits and follow-ups

| Area | Issue |
|---|---|
| Posts don't load under `vite dev` (Notion and Contentful both need `api/`) | BrianLusina/journal#802 |
| The forms' rate limit is per function instance, and there is no CAPTCHA (see [Forms](#forms)) | Follow-up to BrianLusina/journal#826 |
