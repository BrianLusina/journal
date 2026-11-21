# apps/sites skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `apps/sites`, one Astro app that serves `brianlusina.com` (site `home`) and `folio.brianlusina.com` (site `folio`). It routes by hostname from a configurable site registry. On previews, a `?site=` override picks the site. It has per-site SEO basics, its own Vercel project, and Playwright `home`/`folio` projects. Each site serves a placeholder page; the features come later (P8–P11).

**Architecture:**
- **The decision, in pure functions.** A JSON registry (`sites.config.json`, replaceable by a `SITES_CONFIG` env var) maps each environment's hostnames to site ids. `resolveRequest()` turns `(host, path, cookie, VERCEL_ENV)` into exactly one outcome: serve a site, redirect, show the preview landing page, or 404.
- **The middleware applies it.** It rewrites to that site's internal route prefix (`/home/…`, `/folio/…`).
- **Cross-site links come from the same registry**, so staging links to staging.
- **Rendering:** pages are server-rendered on `@astrojs/vercel`, with `Cache-Control` headers and no ISR (see Scope decisions). Styling is `@brianlusina/ui`'s `styles.css` plus its Tailwind 3 preset, through PostCSS.

**Tech Stack:** Astro 7.4 (`astro@^7.4.13`, Vite 8), `@astrojs/vercel@^11.0.22`, `@astrojs/react@^7.1.9` with React 18.3, Tailwind 3.4 via PostCSS, `@astrojs/check`, Vitest 3, Playwright 1.65, bun 1.3.14.

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md`: §3 (constraints: Hobby plan, Namecheap DNS, branches), §4 (architecture and routing), §7 (quality gates), §8 (portability) and §10. Issue #928. Roadmap row P5.

## Global Constraints

- **blog.brianlusina.com changes in no way a reader could notice.** The blog parity suite stays green, and nothing under `apps/blog/` changes except where a task says so.
- **DNS stays on Namecheap.** Domains are added to the Vercel project explicitly, with no wildcard. Unknown hosts get a 404. **Don't touch the apex or `folio` records** (that's #930). Staging CNAMEs are Brian's, below.
- **Costs stay on free tiers (Vercel Hobby).** No feature in this PR may need a paid plan.
- **Current versions only; nothing is ported** from `brianlusina.github.io` or `portfolio`.
- **Stay on Tailwind 3** until both apps upgrade together. The sites use `@brianlusina/ui`'s preset and `uiContent`.
- **Secrets are server-only.** Nothing secret uses a `PUBLIC_` or `VITE_` prefix.
- **Coverage ≥ 85% lines** for `apps/sites`.
- **Dependencies:**
  - bun only, with `bun add --cwd apps/sites`.
  - The lockfile may re-hoist, but it must not change a version any existing workspace resolves. Check with the `name@version` set diff from P4.
- Pushes go only to the working branch.

## Scope decisions (where this departs from #928)

| #928 says | Decision | Why |
|---|---|---|
| `isr` with `exclude` covering `/api/*` | **No ISR in P5.** Server-render, and set `Cache-Control: s-maxage=300, stale-while-revalidate=86400` on hostname-resolved site pages. Use `private, no-store` on override, landing and 404 responses. | ISR caches by path. `brianlusina.com/` and `folio.brianlusina.com/` share the path `/`, and the preview override changes the response with a cookie, not the URL. Cross-site cache poisoning is the failure mode. Spec §10: "ISR is an optimisation, not a feature the design depends on." Revisit with a spike when pages have content (P10). |
| `skewProtection` on | **Off.** | It is not a Hobby-plan feature (spec §3). If Brian confirms the plan has it, it's a one-line change. |
| Block internal prefixes in production | **Block them everywhere** (404 for any request whose path starts with `/home` or `/folio`). | It gives one rule, the same on previews as in production, and a single URL per page everywhere. |
| (silent) `www` | **`www.brianlusina.com` → 301 to `https://brianlusina.com` with the same path and query.** | It gives a single URL per page (canonical). |
| Node adapter seam | **Keep only the seam.** The adapter is chosen in one place in `astro.config.mjs`, and the Node build is not added (#928: "add that build once there's a need"). | YAGNI. |

## Brian's out-of-repo steps (Task 4 needs them; spec §9)

1. **Create a Vercel project `sites`** in the same team:
   - Root Directory `apps/sites`, framework Astro, Node 22.x;
   - production branch `production`;
   - "Include files outside the root directory" on, as for `journal`.
2. **Add the domains** to the project: `brianlusina.com`, `www.brianlusina.com` and `folio.brianlusina.com` on `production`, and `staging.brianlusina.com` and `staging.folio.brianlusina.com` on `staging`. Change no DNS for the apex or `folio`.
3. **Add Namecheap CNAMEs** for `staging` and `staging.folio`, with the values Vercel shows. These are new hostnames, so nothing live changes.
4. **Enable Protection Bypass for Automation** on `sites`, and store its value as the repo secret `VERCEL_AUTOMATION_BYPASS_SECRET_SITES`. The bypass secret is per project.
5. Tell me the exact `deployment_status` environment names GitHub shows for the two projects (e.g. `Preview – journal`, `Preview – sites`). Task 4's project routing keys on them.

## Review Focus

1. **The preview override reaching production.** `VERCEL_ENV` is unset in Docker and on other hosts, so "`VERCEL_ENV !== 'production'`" alone would honour `?site=` on a self-hosted production domain. The override must be refused on any hostname the registry lists as production, whatever `VERCEL_ENV` says. Tested in Task 2.
2. **One site's response cached for another.** A hostname-resolved page and an override-resolved page must never share a cache entry. Override, landing and 404 responses send `private, no-store`, and every response to a cookie-dependent request sends `Vary: Cookie`. Tested in Task 3.
3. **Host header variants.** These must resolve, not 404:
   - `BrianLusina.com` (any case);
   - `brianlusina.com:443` or `:80` (port present);
   - `brianlusina.com.` (trailing dot);
   - `folio.localhost:4321` (port kept locally).
   Tested in Task 2.
4. **Previews and staging indexed by search engines.** Outside production, `robots.txt` disallows everything and pages carry `X-Robots-Tag: noindex`. Canonical URLs always point at the production hostname. Tested in Task 3.
5. **The blog suite running against a `sites` deployment, or the reverse.** `e2e.yml` picks Playwright projects by the deployment's environment name, and an unknown name runs nothing and fails loudly. Tested in Task 4.

---

### Task 1: Scaffold `apps/sites` (Astro 7, React, Vercel adapter, Tailwind 3 + `@brianlusina/ui`)

**Files:**
- Create: `apps/sites/package.json`, `astro.config.mjs`, `tsconfig.json`, `postcss.config.cjs`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `apps/sites/src/layouts/Base.astro` (inlines `themeScript` in `<head>` and imports `@brianlusina/ui/styles.css`)
- Create: `apps/sites/src/pages/home/index.astro` and `apps/sites/src/pages/folio/index.astro` (placeholders: an `<h1>` with the site name and a `ThemeToggle` island)
- Modify: root `package.json` (`dev:sites`, `build:sites`), `.nvmrc`, `Dockerfile` (`COPY apps/sites/package.json apps/sites/`; the P3 policy test requires it)

**Interfaces:**
- Produces:
  - `Base.astro` props `{ title: string; description?: string; canonical: string; noindex: boolean }`;
  - `apps/sites` scripts `dev`, `build`, `preview`, `test`, `test:coverage`, `typecheck` (`astro check`) and `lint` (`eslint src`).

- [ ] **Step 1: Node.** Bump `.nvmrc` from `22.16.0` to `22.23.4`, because Astro 7 requires `>=22.23.4` and CI's `setup-node` reads `.nvmrc`. This is a Node patch-level bump. The blog's Vercel project has its own Node setting, so this doesn't change the blog.
- [ ] **Step 2: Packages.**
  - Add `astro@^7.4.13`, `@astrojs/vercel@^11.0.22`, `@astrojs/react@^7.1.9` and `@astrojs/check@^0.9.12` to `apps/sites`.
  - Add `react`/`react-dom` `^18.3.1`, `@brianlusina/ui: workspace:*`, and `tailwindcss@^3.4.17` + `autoprefixer@^10.4.21` + `postcss@^8.5.6` at the versions already locked.
  - Add `vitest@^3.2.4` and `typescript@^5.8.3`.
  - Check the lockfile with the set diff from Global Constraints.
- [ ] **Step 3: Config.**
  - `astro.config.mjs`: `output: 'server'`, `integrations: [react()]`, and `adapter: vercel()` held in a single `const adapter = vercel()` line (the seam).
  - `tailwind.config.ts`: `{ presets: [preset], content: ['./src/**/*.{astro,ts,tsx}', ...uiContent] }`.
  - `postcss.config.cjs`: `tailwindcss` and `autoprefixer`.
- [ ] **Step 4: Spike gate (Tailwind 3 on Vite 8).** Run `bun run --filter sites build`, then grep the built CSS under `apps/sites/.vercel/output/static/_astro/*.css`.

  Expected: it contains `--background` (the tokens) and an `ArticleCard` class such as `rounded-[2.5rem]`. The second appears only if `uiContent` is scanned, which proves the preset path works.

  If the PostCSS route fails on Vite 8, stop and record a ruling. The fallback is Vite's `css.postcss` inline config in `astro.config.mjs`. Don't move to Tailwind 4 (Global Constraints).
- [ ] **Step 5: Verify.**
  - Run `bun run --filter sites typecheck` (`astro check`: 0 errors) and `lint`.
  - Run the root `test`, `typecheck` and `lint`: every workspace passes, including the repo-policy Dockerfile check.
  - Run `bun run build`: the blog is unchanged, and its CSS is `cmp`-identical to `develop`'s.
- [ ] **Step 6: Commit** (`feat(sites): scaffold apps/sites on Astro 7 with @brianlusina/ui`, `Refs #928`).

### Task 2: Site registry, request resolution and cross-site URLs

**Files:**
- Create: `apps/sites/sites.config.json`
- Create: `apps/sites/src/sites/registry.ts` and `registry.spec.ts`
- Create: `apps/sites/src/sites/resolve.ts` and `resolve.spec.ts`
- Create: `apps/sites/src/sites/urls.ts` and `urls.spec.ts`

**Interfaces:**
- Produces (`src/sites/registry.ts`):
  - `type SiteId = 'home' | 'folio'`
  - `type LinkTarget = SiteId | 'blog'`
  - `type EnvName = 'production' | 'staging' | 'development'`
  - `type RegistryConfig = { environments: Record<EnvName, Record<LinkTarget, string>>; redirects: Record<string, string> }`. Values are hosts, with a port where one is needed (`localhost:4321`).
  - `loadRegistry(env: Record<string, string | undefined>): RegistryConfig`. Uses `SITES_CONFIG` (JSON) when set, else `sites.config.json`. Throws `Error('Invalid SITES_CONFIG: …')` on malformed JSON or a missing site/environment.
  - `normalizeHost(host: string): string`. Lowercase, trailing dot removed, `:443`/`:80` removed; any other port kept.
- Produces (`src/sites/resolve.ts`):
  - `type Resolution = { kind: 'site'; site: SiteId; env: EnvName | 'preview'; via: 'host' | 'override'; setCookie?: SiteId } | { kind: 'redirect'; status: 301; location: string } | { kind: 'landing' } | { kind: 'not-found' }`
  - `resolveRequest(input: { host: string; url: URL; cookie: string; vercelEnv?: string }, registry: RegistryConfig): Resolution`
- Produces (`src/sites/urls.ts`):
  - `siteUrl(target: LinkTarget, path: string, from: { env: EnvName | 'preview'; origin: string }, registry: RegistryConfig): string`
    - The same environment's host for that target. `https` except in `development`, which uses `http`.
    - From `preview`, `home`/`folio` links stay on `origin` with `?site=<id>`, and `blog` links to staging.
  - `canonicalUrl(site: SiteId, path: string, registry): string`: always the production host.

`sites.config.json` holds:
- production: `brianlusina.com`, `folio.brianlusina.com` and `blog.brianlusina.com`;
- staging: `staging.brianlusina.com`, `staging.folio.brianlusina.com` and `staging.blog.brianlusina.com`;
- development: `localhost:4321`, `folio.localhost:4321` and `localhost:8080`;
- redirects: `{ "www.brianlusina.com": "brianlusina.com" }`.

- [ ] **Step 1: Failing tests.**
  - **`registry.spec.ts`:**
    - `normalizeHost` cases: `'BrianLusina.com'` → `'brianlusina.com'`; `'brianlusina.com:443'` → `'brianlusina.com'`; `'brianlusina.com.'` → `'brianlusina.com'`; `'folio.localhost:4321'` is kept (Review Focus 3).
    - `loadRegistry({})` returns the file's config.
    - `loadRegistry({ SITES_CONFIG: '{…a docker host…}' })` returns it.
    - `loadRegistry({ SITES_CONFIG: '{' })` throws `Invalid SITES_CONFIG`.
  - **`resolve.spec.ts`, by hostname:**
    - `brianlusina.com/` → `{ kind:'site', site:'home', env:'production', via:'host' }`.
    - `staging.folio.brianlusina.com/x` → folio/staging.
    - `folio.localhost:4321` → folio/development.
    - `evil.example` with `vercelEnv: 'production'` → `not-found`.
    - `www.brianlusina.com/a?b=1` → `redirect` to `https://brianlusina.com/a?b=1`.
  - **`resolve.spec.ts`, the override (Review Focus 1):**
    - `journal-x.vercel.app/?site=folio` with `vercelEnv:'preview'` → `{ site:'folio', env:'preview', via:'override', setCookie:'folio' }`.
    - The same host with cookie `site=folio` and no query → folio via override, without `setCookie`.
    - The same host with no cookie and no query → `landing`.
    - `?site=nope` → `landing`, with no cookie set.
    - `brianlusina.com/?site=folio` with `vercelEnv: undefined` (Docker) → **home via host**: the override is ignored on a production hostname.
    - An **unregistered** host (e.g. `journal-x.vercel.app`) with `vercelEnv:'production'` and a `site` cookie → `not-found`.
    - A registered staging host with `vercelEnv:'production'` and `?site=folio` → home via host. The override needs `vercelEnv !== 'production'`.
    - `staging.brianlusina.com/?site=folio` (`vercelEnv:'preview'`) → folio via override. Staging is outside production (spec §4.2).
  - **`resolve.spec.ts`, prefixes:** `brianlusina.com/folio/` and `brianlusina.com/home` → `not-found`.
  - **`urls.spec.ts`:**
    - From staging home, `siteUrl('blog','/article/1/x')` → `https://staging.blog.brianlusina.com/article/1/x`.
    - From preview, `siteUrl('folio','/')` → `https://journal-x.vercel.app/?site=folio`.
    - From development, `siteUrl('folio','/p')` → `http://folio.localhost:4321/p`.
    - `canonicalUrl('folio','/p')` → `https://folio.brianlusina.com/p`.

  Run `bun run --filter sites test`. Expected: FAIL (modules missing).
- [ ] **Step 2: Implement** the three modules. Resolution order inside `resolveRequest`:
  1. normalize the host;
  2. redirects;
  3. internal-prefix block;
  4. production hostname → site by host (no override);
  5. other registered hostname: if the override (query, then cookie) is valid and `vercelEnv !== 'production'`, use it; else the site by host;
  6. unregistered host with `vercelEnv !== 'production'`: valid override → site, else `landing`;
  7. otherwise `not-found`.

  Run. Expected: PASS, ≥ 85% coverage.
- [ ] **Step 3: Commit** (`feat(sites): site registry, request resolution and cross-site URLs`, `Refs #928`).

### Task 3: Middleware, preview landing page, `robots.txt`, `sitemap.xml` and canonical URLs

**Files:**
- Create:
  - `apps/sites/src/middleware.ts` and `middleware.spec.ts`
  - `apps/sites/src/pages/index.astro` (the preview landing page: one link per site via `siteUrl`)
  - `apps/sites/src/pages/404.astro`
  - `apps/sites/src/pages/home/robots.txt.ts`, `apps/sites/src/pages/folio/robots.txt.ts` and the matching `sitemap.xml.ts`, sharing `apps/sites/src/seo/robots.ts`, `sitemap.ts` and `seo.spec.ts`
  - `apps/sites/src/sites/routes.ts` (`ROUTES: Record<SiteId, string[]>`, starting at `['/']` each)
- Modify: `Base.astro` (canonical and noindex from `Astro.locals`)

**Interfaces:**
- Consumes: Task 2's `loadRegistry`, `resolveRequest`, `siteUrl` and `canonicalUrl`.
- Produces:
  - `Astro.locals.site: { id: SiteId; env: EnvName | 'preview'; via: 'host' | 'override' }`
  - `robotsTxt(site: SiteId, isProduction: boolean, registry): string`. In production it is `User-agent: *\nAllow: /\nSitemap: https://<prod host>/sitemap.xml\n`; otherwise `User-agent: *\nDisallow: /\n`.
  - `sitemapXml(site: SiteId, registry): string`: one `<url><loc>` per `ROUTES[site]` entry, with production hosts.

- [ ] **Step 1: Failing tests.** `middleware.spec.ts` calls the exported `onRequest` with a fake `context` (`{ request, url, cookies, locals, rewrite }`) and a `next` stub.
  - A host-resolved site calls `rewrite('/home/')` for `/`, sets `locals.site`, and adds `Cache-Control: s-maxage=300, stale-while-revalidate=86400` to the response.
  - An override:
    - sets the `site` cookie (`Path=/; HttpOnly; SameSite=Lax; Secure`, session);
    - rewrites to `/folio/`;
    - sets `Cache-Control: private, no-store` and `Vary: Cookie` (Review Focus 2);
    - adds `X-Robots-Tag: noindex`.
  - `landing` rewrites to `/` and sends `private, no-store`.
  - `not-found` returns a 404 response from `/404`, with `private, no-store`.
  - `redirect` returns a 301 with the `Location`.
  - Outside production, every response carries `X-Robots-Tag: noindex` (Review Focus 4).

  `seo.spec.ts`:
  - Checks the exact `robotsTxt` strings for production and non-production.
  - Checks that `sitemapXml('folio')` contains `<loc>https://folio.brianlusina.com/</loc>` and no other host.

  Run. Expected: FAIL.
- [ ] **Step 2: Implement.** `onRequest` calls `resolveRequest` with `{ host: request.headers.get('host') ?? url.host, url, cookie: request.headers.get('cookie') ?? '', vercelEnv: process.env.VERCEL_ENV }`. The registry is loaded once at module scope. `Base.astro` renders `<link rel="canonical" href={canonicalUrl(...)}>` and, when `locals.site.env !== 'production'`, `<meta name="robots" content="noindex">`. Run. Expected: PASS, ≥ 85%.
- [ ] **Step 3: Local check.** Run `bun run --filter sites dev`, then:
  - `curl -sI http://localhost:4321/`: 200, home `<h1>`.
  - `curl -s -H 'Host: folio.localhost:4321' http://localhost:4321/`: folio `<h1>`.
  - `curl -sI http://localhost:4321/folio/`: 404.
  - `curl -s http://localhost:4321/robots.txt`: `Disallow: /`.

  Stop the server.
- [ ] **Step 4: Commit** (`feat(sites): hostname middleware, preview override, robots and sitemap per site`, `Refs #928`).

### Task 4: E2E for both sites, project routing in CI, and the preview gate

**Files:**
- Create:
  - `e2e/lib/projects.ts` and `e2e/lib/projects.spec.ts`
  - `e2e/sites/fixtures.ts`
  - `e2e/home/smoke.spec.ts` and `e2e/folio/smoke.spec.ts`
- Modify: `playwright.config.ts` (`home` and `folio` projects), `.github/workflows/e2e.yml`

**Interfaces:**
- Produces:
  - `projectsFor(environment: string): string[]`: environments naming the `journal` project → `['lib', 'setup', 'blog']`; `sites` → `['lib', 'home', 'folio']`; anything else throws `Error('Unknown deployment environment: …')`. The exact strings come from Brian's step 5.
  - `bypassSecretName(environment: string): 'VERCEL_AUTOMATION_BYPASS_SECRET' | 'VERCEL_AUTOMATION_BYPASS_SECRET_SITES'`.
  - The `e2e/sites` fixture: when `E2E_BASE_URL`'s host is not a registered hostname (a preview), each test adds the cookie `site=<project's site>` for the base URL before navigating.

- [ ] **Step 1: Failing tests.** `projects.spec.ts` (Review Focus 5):
  - `Preview – journal` → the blog projects;
  - `Preview – sites` and `Production – sites` → the site projects;
  - `Preview – other` throws.

  Run `bunx playwright test --project=lib`. Expected: FAIL.
- [ ] **Step 2: Implement** `projects.ts`.
  - `e2e.yml`: for `deployment_status`, a step computes `PROJECTS` (`bun e2e/lib/projects.ts "$ENVIRONMENT"`) and picks the bypass secret by name, then runs `bunx playwright test $(for p in $PROJECTS; do printf -- '--project=%s ' "$p"; done)`.
  - The scheduled production smoke stays blog-only. P12 extends it (#941).
  - Run the `lib` tests. Expected: PASS.
- [ ] **Step 3: Smoke specs.** `home/smoke.spec.ts` and `folio/smoke.spec.ts`, tagged `@smoke`:
  - the site's `<h1>`;
  - `<link rel=canonical>` with the production host;
  - `/folio/` → 404 (prefix blocked);
  - `robots.txt` → `Disallow: /` on the preview;
  - no console errors (reuse the `pageErrors` fixture).
- [ ] **Step 4: Verify** with the root `test`, `typecheck` (including `typecheck:e2e`) and `lint`, plus `bunx playwright test --project=lib`. Commit (`test(e2e): home and folio projects; route deployments to their projects`, `Refs #928`). Push.
- [ ] **Step 5: Preview gate (needs Brian's steps 1–5).**
  - The `sites` preview for this commit is Ready, and its E2E run executes `home` and `folio` and passes.
  - The `journal` preview's E2E run still executes only the blog projects and passes with no baseline changes.
  - If Brian's steps are not done yet, stop here, ledger the blocker, and ask.

### Task 5: Docs and final gates

**Files:** `docs/ARCHITECTURE.md` (new "apps/sites" section, and Source layout row), `README.md` (run it locally: `bun run dev:sites`, `folio.localhost:4321`), `AGENTS.md` (one line)

- [ ] **Step 1: Docs.** The ARCHITECTURE section covers:
  - the registry and `SITES_CONFIG`;
  - the resolution order (Task 2, Step 2);
  - the override, and why it's refused on production hostnames;
  - caching and why there's no ISR yet;
  - robots, sitemap and canonical;
  - the adapter seam;
  - how CI routes deployments to Playwright projects.
- [ ] **Step 2: Final gates.**
  - The root `test`, `test:coverage`, `typecheck`, `lint` and `build` pass.
  - The blog's CSS `cmp` is identical.
  - `bunx playwright test --project=lib` passes.
  - Both previews' E2E runs are green.
- [ ] **Step 3: Commit** (`docs: describe apps/sites`, `Refs #928`). Push. Ask Brian before opening the PR against `develop`.
