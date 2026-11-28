# Platform packages: flags, analytics and consent (P7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `apps/sites` typed feature flags (env, plus Vercel Edge Config), and analytics behind consent: Vercel Web Analytics always, and GA4 only after the reader accepts. The blog's behaviour stays unchanged.

**Architecture:**
- **`packages/flags`** holds the flag registry, the resolution order (**remote → env → default**, falling through on a provider error or timeout), the env parser moved from the blog, and an Edge Config provider that caches its reads.
- **`packages/analytics`** holds a tiny, framework-free API: `pageview` goes to GA4 (Vercel Web Analytics counts page views itself), and custom events go to GA4 only, with a `site` parameter. It's production-only and consent-gated, and loads `gtag.js` only once consent is given. The search-term sanitisers move here from the blog.
- **Consent banner:** a `ConsentBanner` React island in `packages/ui` stores the choice in a `consent` cookie, on `.brianlusina.com` where it can.
- **`apps/sites` wiring:** the layout mounts the banner and Vercel's `<Analytics />`, and gates GA4 on a real flag, `analytics`.

**Tech Stack:** TypeScript packages in the bun workspace, Vitest (jsdom for the banner), Storybook, Astro islands, `@vercel/analytics` 2.0.1 (already locked), the Edge Config REST API over `fetch` (no SDK), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` §6.4 (analytics and consent) and §6.6 (flags). Issues #931 and #932 carry the scope. Roadmap: P7.

## Global Constraints

- **Lockfile rule:** no `name@version` may leave the root `bun.lock`. This plan adds no new third-party version: `@vercel/analytics@2.0.1` is already locked.
- **Blog unchanged:** the blog keeps reading flags once at page load from `VITE_FEATURES`. Its built CSS stays byte-identical (the `cmp` check), and the blog parity E2E stays green. Code that moves to a package must keep its tests passing unchanged.
- **Flags:** resolved in the order **remote → env → default**. A provider that throws, or that takes longer than its timeout (`FLAG_PROVIDER_TIMEOUT_MS = 300`), falls through to the next. Edge Config is read server-side only, never in `src/middleware.ts`.
- **Edge Config budget:** Hobby allows 100,000 reads a month, and pauses the feature for the rest of the 30-day window if exceeded. The provider caches a read for `EDGE_CONFIG_TTL_MS = 300_000` (5 minutes) per server instance. Each instance then makes at most 288 reads a day, which keeps a dozen always-warm instances under the limit.
- **Analytics:** nothing is sent outside production. On `apps/sites`, production is `locals.site.env === 'production'`, from the P5 registry. GA4 requests start only after consent: `gtag.js` isn't even loaded before it ("basic" Consent Mode, with `analytics_storage` denied by default and granted on accept). Vercel Web Analytics runs regardless, being cookieless.
- **GA4 ID:** the measurement ID is the blog's (`VITE_FIREBASE_MEASUREMENT_ID`), passed to `apps/sites` as `PUBLIC_GA_MEASUREMENT_ID`. It's public by design. Cookies go on `.brianlusina.com` (`cookie_domain: 'auto'` does this).
- **Custom events (v1 names):** `resume_download`, `contact_submit` (with `outcome: 'success' | 'failure'`), `outbound_click`, `project_filter`, plus the blog's `search` and `select_content`. P7 defines and tests them; P8, P11 and P13 send them.

## Scope departures from #931/#932/#933 (each is a ruling, and goes in the ledger)

- **`packages/media` (#933) moves to P9.** Its first consumers arrive there:
  - GitHub project covers, including private-repo images that must be ingested;
  - then Notion post images, in P10.

  Ingest needs a Cloudinary account, a secret and a real image source to test against. Built now, it would be an interface without a caller, and those tend to come out wrong. It also needs an answer to what happens when the 25 credits run out, which is better found with real usage in sight.
- **The privacy page that lists both trackers is P8's** (#934 builds the privacy page). P7 ships the banner's copy with a link to `/privacy`.
- **The Playwright check for "a page view after accepting" can't run on a preview.** Analytics is production-only by design, so GA4 never sends there. On the preview, E2E checks that no GA4 request happens before consent, and that accepting sets the `consent` cookie and still sends nothing. Unit tests cover "accept → `gtag.js` loads and a `page_view` is sent" with production on.
- **The blog doesn't adopt the banner or the analytics package** (the spec's "after cutover"). It only moves two pure functions it already has, and its flag parser, into the packages, with its tests unchanged.

## Review Focus

1. **A flag provider that hangs.** An Edge Config request that never answers must not stall the page past `FLAG_PROVIDER_TIMEOUT_MS`. The page renders with env or default values. Task 1 pins it with a never-resolving provider and fake timers.
2. **Consent cookie values from elsewhere.** A cookie like `consent=granted; consent=denied`, `consent=GRANTED`, or garbage must be treated as "no choice yet". The banner shows, and nothing loads. Task 3 pins it.
3. **Events before `gtag.js` has loaded.** A `pageview` or `event` fired after accept, but before the script loads, must queue on `dataLayer` and be sent in order, not dropped. Task 2 pins it.
4. **Previews and local runs.** With `isProduction: false`, accepting must still never inject `gtag.js` (no request to `googletagmanager.com`). Task 2 pins it in a unit test, and Task 4 in E2E.
5. **Edge Config misconfigured.** A missing `EDGE_CONFIG` variable, a 401, a non-JSON body, or a non-boolean value for a flag all fall through to env and default, never throw. A non-boolean value is ignored for that flag only. Task 1 pins it.

---

### Task 1: `packages/flags`

**Files:**
- Create in `packages/flags/`:
  - `package.json` (`@brianlusina/flags`, private, `main`/`types` `index.ts`, scripts `test`, `test:coverage`, `typecheck`, `lint`);
  - `index.ts`, `tsconfig.json`, `vitest.config.ts`, `README.md`;
  - `src/registry.ts`, `src/parse.ts`, `src/resolve.ts`, `src/edgeConfig.ts`, each with a `*.spec.ts` beside it.
- Modify:
  - `apps/blog/src/config/features.ts`: `parseFeatures` delegates to `parseFlagList`;
  - `apps/blog/package.json` (`@brianlusina/flags: workspace:*`);
  - `Dockerfile` (`COPY packages/flags/package.json packages/flags/`; the repo policy requires every workspace manifest copied);
  - `docs/ARCHITECTURE.md` (the flag table moves to `packages/flags/README.md`; ARCHITECTURE links to it).

**Interfaces:**
- Produces:
  - `type FlagDefinition = { default: boolean; description: string; sites: ReadonlyArray<'blog' | 'home' | 'folio'> }`;
  - `defineFlags<T extends Record<string, FlagDefinition>>(flags: T): T`;
  - `parseFlagList<N extends string>(raw: string | undefined, names: readonly N[], warn?: (message: string) => void): Partial<Record<N, boolean>>`;
  - `type FlagProvider = { name: string; read(): Promise<Partial<Record<string, boolean>>> }`;
  - `resolveFlags<N extends string>(defaults: Record<N, boolean>, providers: FlagProvider[], options?: { timeoutMs?: number }): Promise<Record<N, boolean>>`. Providers are given highest priority first;
  - `envProvider(raw: string | undefined): FlagProvider`;
  - `edgeConfigProvider(connection: string | undefined, options?: { ttlMs?: number; fetch?: typeof fetch; now?: () => number }): FlagProvider`;
  - `FLAG_PROVIDER_TIMEOUT_MS = 300`, `EDGE_CONFIG_TTL_MS = 300_000`.

- [ ] **Step 1: Write the failing tests**
  - `parse.spec.ts`: the blog's `features.spec.ts` cases, moved as they are, against `parseFlagList`:
    - `on`/`off`/`true`/`false`/`1`/`0`, in any case;
    - a bare name means on;
    - unknown names and values are skipped and reported to `warn`;
    - a later entry wins.
  - `resolve.spec.ts`:
    - remote beats env beats default, per flag; a flag no provider names keeps its default;
    - a provider that throws falls through;
    - a provider that never resolves falls through after `timeoutMs`, with fake timers (Review Focus 1);
    - a provider's names outside `defaults` are ignored.
  - `edgeConfig.spec.ts` (`fetch` injected):
    - it reads `GET https://edge-config.vercel.com/<id>/items?token=<token>`, parsed from a connection string `https://edge-config.vercel.com/<id>?token=<token>`;
    - it keeps boolean values and ignores the others, per key;
    - a second read within `ttlMs` doesn't fetch, and one after it does (with the `now` injected);
    - an undefined connection string, a 401, or a non-JSON body each give `{}`, logged and never thrown (Review Focus 5).
  - `registry.spec.ts`: `defineFlags` keeps the definitions as given, and its keys type-check as flag names.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/flags test`
  - Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**
  - Move the parser out of `apps/blog/src/config/features.ts` into `parseFlagList`, unchanged in behaviour.
  - `parseFeatures(raw)` becomes `{ ...FEATURE_DEFAULTS, ...parseFlagList(raw, NAMES, devWarn) }`, where `devWarn` warns only in `import.meta.env.DEV`. `FEATURE_DEFAULTS` stays in the blog.
  - The Edge Config cache is a module-level `{ at, values }` held per connection string.

- [ ] **Step 4: Verify**
  - Run: `bun run --filter @brianlusina/flags test:coverage` and `bun run --filter blog test -- src/config src/services/cms/adapters`
  - Expected: PASS; flags coverage ≥ 85%; the blog's `features.spec.ts` passes unchanged.

- [ ] **Step 5: Root gates and commit**
  - Run: `bun run test`, `typecheck` and `lint`; the lockfile set diff shows nothing removed.
  - Commit: `feat(flags): typed flags resolved remote → env → default, with an Edge Config provider` (Refs #931)

### Task 2: `packages/analytics`

**Files:**
- Create in `packages/analytics/`:
  - `package.json`, `index.ts`, `tsconfig.json`, `vitest.config.ts` (jsdom), `README.md`;
  - `src/analytics.ts`, `src/events.ts`, `src/searchTerms.ts`, each with a `*.spec.ts` beside it.
- Modify:
  - `apps/blog/src/services/search/searchAnalytics.ts`: import `normalizeSearchTerm` and `mayBePersonal` from `@brianlusina/analytics`;
  - `apps/blog/package.json`;
  - `Dockerfile`.

**Interfaces:**
- Produces:
  - `type SiteEvent = { name: 'resume_download' } | { name: 'contact_submit'; outcome: 'success' | 'failure' } | { name: 'outbound_click'; target: 'blog' | 'github' | 'project'; url: string } | { name: 'project_filter'; filter: string; value: string }`;
  - `createAnalytics(options: { site: 'home' | 'folio'; isProduction: boolean; measurementId: string | undefined; window?: Window }): { grant(): void; pageview(path: string): void; event(event: SiteEvent): void }`;
  - `normalizeSearchTerm`, `mayBePersonal` (moved, unchanged).

- [ ] **Step 1: Write the failing tests**
  - `searchTerms.spec.ts`: the blog's existing cases for both functions, moved as they are.
  - `analytics.spec.ts` (jsdom; script injection observed on `document.head`):
    - before `grant()`, `pageview` and `event` inject no script and push nothing to `dataLayer`;
    - `grant()` with `isProduction: true` injects one `https://www.googletagmanager.com/gtag/js?id=<id>`, and pushes, in order:
      - `consent default` (`analytics_storage: 'denied'`);
      - `consent update` (`granted`);
      - `config <id>` (`send_page_view: false`, `cookie_domain: 'auto'`);
    - after `grant()`, `pageview('/x')` pushes a `page_view` event with `page_path: '/x'` and `site`;
    - `event({ name: 'contact_submit', outcome: 'failure' })` pushes `contact_submit` with `{ outcome: 'failure', site: 'home' }`;
    - events fired before `grant()` are dropped, not replayed;
    - events between `grant()` and the script's load queue on `dataLayer` in order (Review Focus 3);
    - `grant()` twice injects one script;
    - with `isProduction: false`, or with no `measurementId`, `grant()` injects nothing and every call is a no-op (Review Focus 4).
  - `events.spec.ts`: `outbound_click` keeps only the URL's origin and path, never its query string.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/analytics test`
  - Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**
  - Use `gtag` over `window.dataLayer`, as Google's snippet does, with no SDK.
  - The blog's `searchAnalytics.ts` imports the moved functions and otherwise stays as it is. The blog keeps Firebase.

- [ ] **Step 4: Verify**
  - Run: `bun run --filter @brianlusina/analytics test:coverage` and `bun run --filter blog test -- src/services/search`
  - Expected: PASS; the blog's search specs pass unchanged.

- [ ] **Step 5: Root gates and commit**
  - Commit: `feat(analytics): production-only, consent-gated GA4 for the sites` (Refs #932)

### Task 3: Consent banner in `packages/ui`

**Files:**
- Create in `packages/ui/src/consent/`:
  - `consentCookie.ts`, `ConsentBanner.tsx`;
  - `consentCookie.spec.ts`, `ConsentBanner.spec.tsx`, `ConsentBanner.stories.tsx`.
- Modify:
  - `packages/ui/src/theme/themeCookie.ts`: extract `sharedCookieDomain(hostname)`, which `themeCookieDomain` now calls. The theme specs pass unchanged;
  - `packages/ui/index.ts` (exports).

**Interfaces:**
- Produces:
  - `type Consent = 'granted' | 'denied'`;
  - `CONSENT_COOKIE = 'consent'`;
  - `readConsentCookie(cookie: string): Consent | undefined`;
  - `serializeConsentCookie(consent: Consent, location: { hostname: string; protocol: string }): string`, with the theme cookie's attributes: one year, `SameSite=Lax`, the shared domain, and `Secure` on https;
  - `ConsentBanner(props: { onGrant: () => void; privacyHref?: string })`, with `privacyHref` defaulting to `/privacy`.

- [ ] **Step 1: Write the failing tests**
  - `consentCookie.spec.ts`:
    - round trip for both values;
    - `.brianlusina.com` on `folio.brianlusina.com`, and no Domain on a `vercel.app` preview or on localhost;
    - `readConsentCookie` gives `undefined` for a missing cookie, `GRANTED`, `yes`, or two conflicting `consent=` pairs (Review Focus 2).
  - `ConsentBanner.spec.tsx`:
    - with no cookie it renders a region named "Cookie consent", with "Accept" and "Decline" buttons and a "privacy" link to `/privacy`;
    - "Accept" writes `consent=granted`, calls `onGrant` once, and hides the banner;
    - "Decline" writes `consent=denied`, doesn't call `onGrant`, and hides it;
    - with `consent=granted` already set, it renders nothing and calls `onGrant` on mount;
    - with `consent=denied`, it renders nothing and doesn't call `onGrant`.

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter @brianlusina/ui test -- src/consent src/theme`
  - Expected: the consent specs fail, and the theme specs pass.

- [ ] **Step 3: Implement**
  - The copy is: "This site uses cookies for analytics, only if you accept. [privacy]". The buttons use `Button` from `packages/ui`, styled from the preset's tokens.
  - The story shows the banner in light and dark.

- [ ] **Step 4: Verify**
  - Run: `bun run --filter @brianlusina/ui test:coverage` and `bun run storybook:build`
  - Expected: PASS.

- [ ] **Step 5: Commit** `feat(ui): consent banner with a cookie shared across brianlusina.com` (Refs #932)

### Task 4: Wire flags, analytics and consent into `apps/sites`

**Files:**
- Create:
  - `apps/sites/src/flags.ts`: the registry, `siteFlags(site)`, and `analytics` (`default: false`, `sites: ['home', 'folio']`, "GA4 behind the consent banner");
  - `apps/sites/src/flags.spec.ts`;
  - `apps/sites/src/components/SiteAnalytics.tsx`: an island that creates the analytics from props, renders `ConsentBanner` with `onGrant={analytics.grant}`, and sends `pageview(location.pathname)` once granted;
  - `apps/sites/src/components/SiteAnalytics.spec.tsx`;
  - `e2e/sites/consent.spec.ts`, run by both the `home` and `folio` projects.
- Modify:
  - `apps/sites/src/layouts/Site.astro`:
    - Vercel's `<Analytics />` from `@vercel/analytics/astro`;
    - `<SiteAnalytics client:idle ... />` only when `flags.analytics` is on;
  - `apps/sites/package.json` (`@brianlusina/flags`, `@brianlusina/analytics`, and `@vercel/analytics` `2.0.1`, plus the `jsdom` and Testing Library dev dependencies at the versions `packages/ui` locks);
  - `apps/sites/vitest.config.ts`: `include` also takes `src/**/*.spec.tsx`. `SiteAnalytics.spec.tsx` sets `// @vitest-environment jsdom`, and the other specs stay on `node`;
  - `playwright.config.ts`: the `home` and `folio` projects move to `testDir: 'e2e'`, with `testMatch: ['home/**/*.spec.ts', 'sites/**/*.spec.ts']` and `['folio/**/*.spec.ts', 'sites/**/*.spec.ts']`. The shared consent spec uses the `site` fixture from `e2e/sites/fixtures.ts`.

**Interfaces:**
- Consumes:
  - `defineFlags`, `resolveFlags`, `envProvider`, `edgeConfigProvider` (Task 1);
  - `createAnalytics` (Task 2);
  - `ConsentBanner` (Task 3).
- Produces: `siteFlags(site: 'home' | 'folio'): Promise<Record<SiteFlagName, boolean>>`. It reads `process.env.EDGE_CONFIG` and `process.env.SITES_FEATURES`, and is called from `Site.astro` only, never from `src/middleware.ts`.

- [ ] **Step 1: Write the failing tests**
  - `flags.spec.ts`:
    - `analytics` is false with no providers;
    - `SITES_FEATURES=analytics=on` turns it on;
    - Edge Config `{ analytics: false }` beats env `on`;
    - a flag whose `sites` excludes the requested site is left out of the result.
  - A source check in `flags.spec.ts`: `src/middleware.ts` doesn't import `./flags` or `@brianlusina/flags`.
  - `SiteAnalytics.spec.tsx` (`@brianlusina/analytics` mocked):
    - it renders the banner;
    - accepting calls `grant` and then `pageview` with the current path;
    - with `consent=granted` set, it grants on mount without showing the banner.
  - `e2e/sites/consent.spec.ts` (`@smoke`). It's skipped unless the page has the "Cookie consent" region, which only renders while the `analytics` flag is on. It checks:
    - no request to `googletagmanager.com` or `google-analytics.com` from load until "Accept";
    - after "Accept", `document.cookie` has `consent=granted`;
    - on a preview, still no GA request after accepting (Review Focus 4).

- [ ] **Step 2: Run them to verify they fail**
  - Run: `bun run --filter sites test`
  - Expected: FAIL, the modules don't exist.

- [ ] **Step 3: Implement**
  - `Site.astro` passes these props to the island:
    - `isProduction={Astro.locals.site?.env === 'production'}`;
    - `measurementId={import.meta.env.PUBLIC_GA_MEASUREMENT_ID}`;
    - the `site`.
  - `<Analytics />` goes in unconditionally: Vercel Web Analytics is cookieless, and Vercel only collects in production.

- [ ] **Step 4: Verify**
  - Run: `bun run --filter sites test`, `bun run build:sites` and `bun run typecheck`
  - Expected: PASS.
  - Then the local preview simulation from P5: `E2E_BASE_URL=http://127.0.0.1:4321` with `SITES_FEATURES=analytics=on` on the dev server. Run `bunx playwright test --project=home --project=folio`. Expected: the smoke and consent specs pass.

- [ ] **Step 5: Commit** `feat(sites): flags, Vercel Web Analytics, and GA4 behind consent` (Refs #931, #932)

### Task 5: Docs and final gates

**Files:**
- `packages/flags/README.md` (the flag table, moved from ARCHITECTURE, with the sites' `analytics` flag added);
- `packages/analytics/README.md` (API, events, consent flow, production guard);
- `docs/ARCHITECTURE.md`:
  - Source layout rows for both packages;
  - "Feature flags" becomes a short section linking to the README, and says the blog keeps env flags;
  - a new "Analytics and consent" section for the sites;
  - Configuration: `SITES_FEATURES`, `EDGE_CONFIG`, `PUBLIC_GA_MEASUREMENT_ID`;
- `AGENTS.md` (one line);
- `docs/superpowers/plans/2026-11-12-sites-roadmap.md`: P7 status, and media moved into P9's row.

- [ ] **Step 1: Docs**, as listed above. The Edge Config section states the read budget arithmetic from Global Constraints.

- [ ] **Step 2: Final gates**
  - The root `test`, `test:coverage`, `typecheck`, `typecheck:api`, `typecheck:server`, `typecheck:e2e`, `lint`, `build`, `build:sites` and `storybook:build` pass.
  - The blog CSS `cmp` is identical.
  - `bunx playwright test --project=lib` passes.
  - The lockfile set diff has nothing removed.
  - `packages/flags` and `packages/analytics` declare no runtime `dependencies`, so nothing ES-only can reach the blog's CommonJS functions through them.
  - Both previews' E2E runs are green.

- [ ] **Step 3: Commit** `docs: describe flags, analytics and consent` (Refs #931, #932). Push, then ask Brian before opening the PR against `develop`.

## Out of repo (Brian)

1. Turn on Vercel Web Analytics for the `yggdrasil` project (Project → Analytics → Enable).
2. On `yggdrasil`, set `PUBLIC_GA_MEASUREMENT_ID` to the blog's measurement ID, for Preview and Production.
3. Optionally, create an Edge Config store, connect it to `yggdrasil` (which sets `EDGE_CONFIG`), and add `{ "analytics": true }` once you want GA4 on. Without it, `SITES_FEATURES=analytics=on` does the same through env.
4. In GA4, check the property's data retention and that Google Signals stays off: cross-site journeys need only the first-party cookie.
