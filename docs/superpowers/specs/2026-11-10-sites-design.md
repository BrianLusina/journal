# Personal sites on one monorepo: design

Status: ready for approval · Date: 2026-11-10 (owner decisions folded in 2026-11-12) · Tracking: #924 · Decision record: BrianLusina/brianlusina.github.io#980

## 1. Intent

Brian runs three personal sites under `brianlusina.com`:

| Site | Today | Role |
|---|---|---|
| `blog.brianlusina.com` | this repo (Vite + React SPA on Vercel), mature | Writing |
| `brianlusina.com` | `BrianLusina/brianlusina.github.io` (ejected CRA, Netlify), stale | Landing page: who Brian is, a taste of the writing and the work |
| `folio.brianlusina.com` | `BrianLusina/portfolio` (CRA + Vite, Netlify), broken | Projects in depth |

The old two are copies of an outdated scaffold, and every improvement would have to be made three times. **The goal is shared code.** The design system, components, content adapters and server integrations are written once, live in this repo, and are used by every site. Adding a site later (e.g. `quotes.brianlusina.com`) should mean adding pages and a hostname, not new plumbing. The same build should deploy to other environments (staging, Docker) through configuration alone.

## 2. Goals, non-goals, anti-goals

**Goals**
- One repo; shared packages for UI, content, server handlers, flags, media and analytics.
- `brianlusina.com` and `folio.brianlusina.com` rebuilt on the shared code with the features in §5.
- Content edited in a CMS or in a project's repo appears on the sites without a deploy.
- Every merge is gated on end-to-end tests, accessibility and performance budgets.

**Non-goals (for now)**
- Moving the blog to Astro. It stays a Vite SPA; that's a possible later step behind the parity suite.
- A newsletter on the landing page (it stays on the blog).
- Full-text search on folio (filters first; search later behind a flag).
- Visual in-context editing (Sanity Presentation). Plain draft preview only.
- A generic "content framework". Each content type gets a concrete unified model.
- `quotes.brianlusina.com`. It's only the test of "is adding a site easy".

**Anti-goals: failures even if everything "works"**
- **blog.brianlusina.com changes in any way a reader could notice.**
- Personal information (phone number, home address, private email) reachable on any page, PDF or API response.
- A secret in a browser bundle (the folio GitHub token incident, BrianLusina/portfolio#902).
- One site's outage, or one content source's outage, taking down another site or a whole page.
- Old tooling ported from the retired repos.

**How the blog adopts shared pieces (decided):** while the code is extracted (#926, #927), the blog keeps its exact current look. `packages/ui` starts from the blog's own components, so nothing visible changes and the parity suite stays green. After the cutover (#930), the blog adopts the shared pieces as deliberate, separately approved changes, each with its screenshot baselines updated on purpose:
- the shared header and footer with cross-site links;
- the theme cookie on `.brianlusina.com`, migrating from next-themes' `localStorage.theme`;
- the consent banner;
- the contact form's captcha.

Until then the blog keeps its own header, footer and theme storage.

## 3. Constraints

- **Hosting:** Vercel Hobby plan (non-commercial, no overage billing; a feature over its quota pauses). Costs must stay on free tiers.
- **DNS:** stays on Namecheap. Each domain is added explicitly to its Vercel project (A record for the apex, CNAME for subdomains, values as Vercel shows them). No wildcard domain, because that needs Vercel's nameservers. Unknown subdomains don't resolve.
- **Branches** (both Vercel projects): `production` → production domains; `staging` → `staging.*` domains; `develop` and PRs → preview URLs. Work happens on short-lived branches off `develop`; there is no long-lived integration branch.
- **Tooling:** current versions only. bun as the package manager. The repo's own outdated tooling is upgraded in place (#838 Sentry, #843 Vitest), not copied into new packages.
- Existing conventions in `AGENTS.md` / `CLAUDE.md` apply. Each component, page and integration has its own directory with colocated specs and stories, and every feature has tests.

## 4. Architecture (decided)

```
apps/blog         today's journal, moved unchanged (Vite SPA + api/ functions)
apps/sites        Astro: home (brianlusina.com) and folio (folio.brianlusina.com)
packages/ui       tokens, Tailwind preset, theme, router-agnostic components, shared 404 + privacy
packages/cms      unified models + source adapters, server-side
packages/server   shared request handlers (contact, GitHub, revalidate, preview)
packages/flags    feature flags with pluggable providers
packages/media    image ingest/delivery (see §6.3)
packages/analytics  one tracking API, consent-aware
```

Two Vercel projects. The **blog** project (root `apps/blog`) keeps `blog.` and `staging.blog.`. The **sites** project (root `apps/sites`) serves `brianlusina.com`, `www` and `folio.` (plus `staging.` variants).

`apps/sites` picks the site per request (#928):
1. Match the `Host` header against a **site registry** (ids and hostnames per environment, from configuration) and rewrite to that site's routes. An unknown host gets a 404.
2. Outside production, `?site=<id>` sets a cookie that overrides the host. This is how PR previews reach each site.
3. Locally, `localhost:4321` is home and `folio.localhost:4321` is folio.

Cross-site links (home → a blog post) are built from the registry, so staging links to staging.

Build order is in #924: parity baseline (#925) → workspace move (#926) → packages (#927) → `apps/sites` (#928) ∥ Sanity (#929) → cutover and archive (#930). The features below come after #928.

## 5. Features

### 5.1 Shared across all sites
- **Header and footer:** one implementation in `packages/ui`, with links between the three sites and the current one marked. Links come from site settings (§6.1).
- **Theme toggle:** light/dark/system, as the blog has today. There's no flash of the wrong theme on load (fixes #829). The choice is stored in a cookie on `.brianlusina.com`, so it carries between sites.
- **404 page:** one shared page and style; each site's 404 links home.
- **Privacy page:** one shared page. Content lives as Markdown in the repo, so it's versioned and reviewed; a legal text shouldn't change silently in a CMS. It must cover every tracker and form on every site.
- **Contact:** one handler in `packages/server` (Zod validation, Turnstile, durable rate limit per #852, Resend), mounted by each app on its own origin (no CORS). Messages include which site they came from. One form component in `packages/ui`.
- **Analytics, consent, errors, uptime:** §6.4–§6.6.

### 5.2 Home (`brianlusina.com`)
Sections, top to bottom (layout inspired by fatmaali.dev; tokens are the blog's):
1. **Hero:** headline, short bio, primary CTA to projects, secondary to the blog, "working with" stack strip. From Profile.
2. **Experience timeline:** roles in reverse chronological order, with highlights and stack per role, plus education and certifications. From Experience. A **Download résumé** button serves the generated PDF (§5.4).
3. **Featured projects:** default 6, count in site settings. Each card shows title, tagline, stack, status, year, and links to the repo (public projects only) and to the folio detail page.
4. **Featured posts:** default 5, count in site settings. Cards link to the post on the blog; "View all articles" goes to the blog's articles page.
5. **Contact** CTA → the shared contact page.

**Featured rule (posts and projects):** take items marked `featured`, newest first. If there are fewer than N, fill with the newest non-featured items. A source without a `featured` field contributes only to the fill. "Newest" is `publishDate` for posts. For projects it's the most recent of `lastReviewed` and last push (§6.2).

### 5.3 Folio (`folio.brianlusina.com`)
- **Project list:** every published project from all sources, with filters by kind, stack and status (combinable; reflected in the URL). Search is later, behind a `folio-search` flag, reusing the blog's MiniSearch engine.
- **Project detail:** the write-up (Markdown body of `.portfolio.md`, or the Sanity document), with stack, status, links, and a cover image. Private repos show no repo link, stars or other repo metadata.
- Each project page has its own title, description, canonical URL and generated share image (§6.5).

### 5.4 Résumé PDF
- Generated from Profile + Experience, the same data as the timeline, so the two never drift. It's rebuilt when that content changes (on revalidation), not at request time.
- **PII guard:** a test extracts the PDF's text and fails on phone-number patterns, postal-address patterns, and any string in a CI-secret denylist (exact values Brian never wants published). The same check runs over the HTML of every page and every public API response.

## 6. Content and integrations

### 6.1 Content map

| Content | What it is | Lives in | Notes |
|---|---|---|---|
| **Posts** | Blog articles | Notion, Contentful, Sanity (merged) | Existing `UnifiedPost` + aggregator. Add an optional `featured` field per source. |
| **Projects** | Things Brian built | GitHub `.portfolio.md` (public **and** private repos with the `portfolio` topic) + Sanity (work not on GitHub at all) | New `UnifiedProject`. About 60 GitHub repos (50 public, 10 private); a handful in Sanity. |
| **Profile** | Facts about Brian: name, headline, short bio, avatar, location, availability, public contact email, "working with" stack, social links | Sanity (singleton) | Social links move here from Contentful. |
| **Experience** | Timeline entries: role, company, start/end, location, summary, highlights, stack; plus education and certifications | Sanity | Feeds the timeline and the résumé PDF. |
| **Site settings** | Knobs per site that change without a deploy: featured counts (posts 5, projects 6), hero copy, header/footer links, default SEO description and share image | Sanity (one document per site) | Not feature flags (§6.6). |
| **Privacy page** | Legal text | Markdown in the repo | Versioned and reviewed (§5.1). |
| **Résumé PDF** | Generated file | Built from Profile + Experience | §5.4 |

Profile, Experience and Site settings make Sanity required for `apps/sites`. Mitigation: pages are cached (ISR), so a Sanity outage serves the last good version instead of failing.

### 6.2 Projects from GitHub
- **Selection:** repos with the `portfolio` topic. Without it, a repo never appears.
- **File:** `.portfolio.md` at the repo root. YAML frontmatter, validated against a JSON Schema published from this repo:
  - required: `title`, `tagline`, `summary`, `kind` (e.g. `oss`, `work`, `library`, `tool`, `mobile`), `status` (`live`, `maintained`, `archived`, `wip`), `stack` (list), `year`, `lastReviewed` (date);
  - optional: `featured` (bool), `order` (int, overrides the newest-first sort), `links` (`live`, `docs`), `cover` (repo-relative path), `draft` (bool).

  The Markdown body is the write-up (suggested sections: Problem, Approach, Architecture, Outcome).
- **Fetching:** one GitHub GraphQL query lists the owner's repos with topics, visibility, last push, and the contents of `HEAD:.portfolio.md`. That covers all 60 repos in one request, server-side, cached. All repos are owned by the `BrianLusina` user account (confirmed), so one fine-grained, read-only token (Metadata + Contents) covers them all. It's limited to the repos that need it and never reaches the browser.
- **Rendering off GitHub:**
  - rewrite relative links and images to absolute URLs;
  - sanitise raw HTML;
  - render GitHub callout blocks; show mermaid diagrams as code, or render them at build time (builder's choice).
- **Images:** public repo images are delivered through `packages/media`. Private repo images can't be fetched publicly, so they are copied into the media store at ingest (§6.3).
- **CI rule in each portfolio repo:** a reusable GitHub workflow hosted in this repo, called from each project repo. It:
  1. validates `.portfolio.md` against the schema;
  2. fails when `lastReviewed` is older than 6 months, the freshness proxy, since "is the write-up still true?" can't be automated;
  3. on pushes to the default branch that touch `.portfolio.md`, calls the sites' revalidate endpoint (secret in the caller repo).

### 6.3 Images (decided: Cloudinary)
Sources differ. Sanity's image CDN and Contentful's Images API give stable URLs. Notion file URLs expire after about 1 hour. Private GitHub images need auth. Public GitHub raw URLs are stable but unoptimised.
- `packages/media` exposes a source-agnostic `ImageRef` (`id`, `alt`, `width`, `height`, plus an internal locator) used by every unified model, and a `url(ref, { width, format })` helper.
- **Ingest:** images from Notion and private GitHub repos are uploaded to Cloudinary on fetch/revalidation, under a stable id derived from the source (Notion file/block id; repo + path + content hash), so they are uploaded once.
- **Delivery:** all images go through Cloudinary transformations (`f_auto`, `q_auto`, width). Sanity and Contentful images can stay on their own CDNs (builder's choice, behind the same helper).
- Free plan: 25 credits per rolling 30 days (about 1 credit ≈ 1 GB bandwidth, 1 GB storage or 1,000 transformations). Watch usage, and find out what happens when the allowance runs out before relying on it.

### 6.4 Analytics and consent (decided: Vercel Web Analytics + GA4)
Requirements: traffic per site, journeys across sites, custom events, free. No single free tool covers all of them, so two run side by side, each with one job:
- **Vercel Web Analytics stays (decided) for traffic per site.** It's cookieless, so it counts every visit, including visitors who decline the consent banner. It's on both Vercel projects (blog, sites). On Hobby: 50,000 events a month, with collection paused if that's exceeded; no custom events.
- **GA4 for cross-site journeys and custom events.** The blog already sends to it via Firebase. One property with cookies on `.brianlusina.com` follows a visitor across subdomains, and custom events are free. `apps/sites` uses `gtag.js` directly (lighter than the Firebase SDK) with the same measurement ID, and `site` is sent as an event parameter. It runs only after consent. *(Brian confirmed keeping Vercel Web Analytics; keeping GA4 for these two jobs is inferred from the requirements, since Hobby can't provide them.)*
- **Custom events (v1):** `resume_download`, `contact_submit` (success/failure), `outbound_click` (to the blog, GitHub, a project's live URL), `project_filter`, plus the blog's existing `search` / `select_content`.
- **Consent:** a cross-site journey needs a cookie, so EU/UK visitors need a consent banner, whichever tool is used. The blog sets GA4 cookies today **without** one; this fixes that. One consent component in `packages/ui`; GA4 Consent Mode v2, with analytics storage denied until accepted. The privacy page lists every tracker.
- **Not in v1:** Microsoft Clarity (heatmaps and recordings answer "how do people use the page", not traffic). Since 31 Oct 2025 it stays inactive for EEA/UK/CH visitors without a consent signal (Consent API v2). It could be added later through the same consent component.
- Web Vitals come from Sentry (Vercel Speed Insights isn't added).
- `packages/analytics` wraps both providers behind one API (`pageview` goes to both, custom events to GA4 only). Nothing is sent outside production, and search terms are sanitised as the blog does today.

### 6.5 Share images (Open Graph)
None of the CMSes generate share images; they only store images. `apps/sites` exposes `/og/<type>/<slug>.png`, rendered from a JSX template with **Satori** and cached like pages. Templates per type (home, project, post) use the shared tokens. Projects and the home page use them in their meta tags.

**Blog posts:** the blog is a client-rendered SPA and serves the same `<head>` for every route, so link previews of posts stay generic until the blog renders per-route meta. That's a separate decision (an edge function injecting meta for crawlers, or the blog's later Astro move), out of scope here. The OG endpoint is built so the blog can reuse it.

### 6.6 Feature flags (decided: env + Edge Config, with fallbacks)
The blog's flags (`VITE_FEATURES`) are read once at page load. That's deliberate: known before the first render, no extra request, nothing that can be down. Keep that contract.
- `packages/flags`: one typed flag registry (name, default, description, which sites), with pluggable providers resolved in order **remote → env → default**. A provider that fails or times out falls through, so a flag service outage never breaks a page.
- **Providers:**
  - **env** (today's behaviour) for the blog and as fallback everywhere.
  - **Vercel Edge Config** as the instant remote provider for `apps/sites`, read server-side only, at render/regeneration time, never per request in middleware. Hobby allows 100,000 reads and 100 writes a month, and pauses the feature for the rest of the 30-day window if exceeded; reading only at regeneration keeps usage far below that.
- **"Instant" has a caveat:** a cached (ISR) page reflects a flag change at its next regeneration (≤ its expiration, e.g. 60 s) unless a revalidation is triggered. The blog keeps env flags (changing one needs a redeploy) unless instant flags there are worth a runtime fetch.
- **Alternatives behind the same interface**, if Edge Config becomes unavailable: PostHog flags (free tier about 1M requests/month), GrowthBook (open source, can self-host), or a flags document in Sanity revalidated by webhook.

### 6.7 Draft preview
Drafts are a **mode**, not a model change. Every adapter takes `{ preview: boolean }`:
- **Sanity:** the drafts perspective.
- **Contentful:** the Preview API with a preview token.
- **Notion:** statuses other than `Published`.
- **GitHub:** `draft: true` in frontmatter is shown only in preview.

**Entry:** a secret link `/api/preview?secret=…&path=…` sets a preview cookie (on `apps/sites`, Vercel's `__prerender_bypass` with the ISR `bypassToken`) and redirects. Preview responses are never cached, carry `noindex`, and show a visible "Preview" banner with an exit link. The blog's functions accept preview only with the same secret-backed cookie. v1 covers posts and projects; Profile, Experience and Site settings preview comes for free with Sanity's perspective.

### 6.8 Freshness
- Sanity and Contentful webhooks → `POST /api/revalidate` (secret) → revalidate the affected paths (`apps/sites` ISR via `bypassToken`; the blog's edge-cached routes).
- GitHub → the portfolio CI workflow calls the same endpoint (§6.2).
- Notion has no webhook in this design; it relies on cache expiry (minutes).

## 7. Quality gates (every PR, on the Vercel preview)

- **Playwright** projects `blog`, `home`, `folio` (the site override cookie for previews), triggered by GitHub's `deployment_status` event. Use the Deployment Protection bypass header if previews are protected.
- **Blog parity suite** (#925): routes, URL inventory, visual snapshots light/dark, desktop/mobile.
- **Accessibility:** `@axe-core/playwright`. Zero violations on `apps/sites` pages; no new violations on the blog. WCAG AA contrast in both themes.
- **Performance:** Lighthouse CI budgets per site (LCP < 2.5 s, CLS < 0.1, total JS and CSS budgets set from the first green run).
- **PII guard** (§5.4) and the **bundle guard:** fail on `ghp_`, `github_pat_`, private keys, or placeholder strings (`example.com`, Lorem ipsum) in any build output.
- **Unit coverage** ≥ 85% lines per package and app (the blog's current gate).

## 8. Operations

- **Errors and performance:** Sentry (current SDK per #838), one Sentry project per app. Every event is tagged `site` (from the resolved site) and `environment`. Web Vitals come from Sentry's browser tracing.
- **Uptime:**
  - a scheduled GitHub Actions job runs the Playwright smoke tests against each production domain every 30 minutes; a failure notifies by GitHub email;
  - Sentry's free plan includes one uptime monitor, used for `brianlusina.com`.

  An external free monitor (e.g. UptimeRobot, Better Stack) can be added if the Actions schedule proves too coarse.
- **Secrets:** server-only environment variables per Vercel project. Nothing secret uses a `VITE_` or `PUBLIC_` prefix.
- **Portability:** the Vercel adapter is isolated in `astro.config`; a Node adapter build for Docker is a configuration switch. The site registry and all hostnames come from configuration.

## 9. Work outside this repo (Brian)

Brian does all work outside this repo. The repo provides what that work needs: the `.portfolio.md` JSON Schema, the reusable workflow, a template file, and docs. Order matters where code reads new fields:

1. **Notion: add the `featured` checkbox to the Journal CMS database *before* any code that filters or sorts on it is deployed.** Notion rejects a whole query that names a missing property, which would break the blog's posts. Contentful's `featured` field and its content-model publish also come before the code. Sanity's schema ships with its adapter (#929).
2. Sanity project, dataset, and the Profile, Experience and Site settings documents filled in before `apps/sites` pages that read them go to staging.
3. Social links moved from Contentful into Sanity's Profile. The blog keeps reading Contentful until it adopts the shared footer after cutover.
4. For each portfolio repo: add the `portfolio` topic, a `.portfolio.md`, the caller workflow, and the revalidate secret. This can start as soon as the schema and reusable workflow are merged; repos appear on the sites as they're done.
5. Accounts and secrets: Cloudinary, the GitHub fine-grained token, Edge Config store, Turnstile, Sentry DSNs per app, GA4 measurement ID, the PII denylist (CI secret), and Namecheap records at cutover (#930).

## 10. Decided vs left to the builder

**Decided (by Brian):** monorepo with two apps; Astro for `apps/sites`; the blog's look; Sanity added as a source; Namecheap DNS with explicit domains; unknown subdomains 404/don't resolve; short-lived branches; projects from `.portfolio.md` plus Sanity, opted in by the `portfolio` topic, stack in frontmatter; CI rule per project repo; timeline + generated résumé with PII tests; featured = flagged first, else latest; posts 5 / projects 6 by default; filters before search on folio; shared header, footer, 404, privacy, contact; draft preview in scope; Sentry tagged by site; a11y and performance budgets at the merge gate; no newsletter on home; all repos under the `BrianLusina` account; Brian does all out-of-repo work (§9); Vercel Web Analytics stays (§6.4); Cloudinary is the image layer (§6.3); flags are env + Edge Config with fallbacks (§6.6); the blog adopts shared pieces only after cutover (§2).

**Calls made while writing this (check these):**
- *GA4 alongside Vercel Web Analytics* (§6.4): Vercel's Hobby plan has no custom events and can't follow a visitor across sites, so GA4 stays for those two jobs, behind the consent banner.
- *Docker/Node build:* it must serve every page and API route with the same behaviour. It does **not** need ISR. Pages are server-rendered with `Cache-Control: s-maxage=…, stale-while-revalidate=…` for whatever CDN sits in front, and preview simply bypasses those headers. On Vercel, ISR is an optimisation, not a feature the design depends on.
- *What blocks the DNS cutover (#930):*
  - **required:** home and folio (§5.2–§5.3, without the résumé PDF and search), the shared header, footer, 404, privacy and contact, consent + analytics, Sentry tagging, and every §7 gate;
  - **may follow:** the résumé PDF, share images and draft preview.
- *Old URLs:* take a URL inventory of today's `folio.brianlusina.com` and 301 its routes (`/projects/oss`, `/projects/work`, `/projects/*/:slug`) to their new equivalents. `brianlusina.com` today uses hash anchors only, so it needs no redirects.

**Left to the builder:** component breakdown; the Astro route layout per site; the GraphQL query shape; the PDF generation library; mermaid handling; whether Sanity/Contentful images go through Cloudinary; the Studio location (`apps/studio` vs hosted); test file names; the Lighthouse budget numbers after the first green run.
