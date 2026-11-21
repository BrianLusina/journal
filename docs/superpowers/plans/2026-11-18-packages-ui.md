# packages/ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the blog's design system into a workspace package, `@brianlusina/ui`, so `apps/sites` (Astro, P5) gets the blog's look and its shared components. The package holds the tokens, the Tailwind preset, router-agnostic components and the cross-site theme. Nothing on blog.brianlusina.com changes.

**Architecture:** `packages/ui` has three parts:
- **Styles:** the blog's whole design-system stylesheet, moved there unchanged as `styles.css`.
- **Tailwind preset:** `tailwind-preset.ts`, with the content glob for the package's own files.
- **React entry:** `index.ts`, with a `LinkProvider` seam and the components the sites need.

Components render a plain `<a href>` unless an app provides its own link component. The blog provides its React Router link, so in-app navigation stays client-side. The cross-site theme (a cookie on `.brianlusina.com`, a no-flash script and a toggle) is built here for the sites. The blog does not adopt it until after cutover (spec §2).

**Tech Stack:** bun 1.3.14 workspaces, React 18, Tailwind 3.4 (`tailwindcss-animate`), `class-variance-authority`, `clsx`/`tailwind-merge`, `lucide-react`, Vitest 3 + Testing Library (jsdom), Storybook 8.6 (`@storybook/react-vite`), Playwright parity suite (`e2e/`).

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md`: §2 ("how the blog adopts shared pieces"), §4, §5.1 and §7. Issue #927 (the `packages/ui` half); roadmap row P4 in `docs/superpowers/plans/2026-11-12-sites-roadmap.md`.

**Base:** this plan is written against #951 (P3), which adds the `packages/*` workspace glob, the root `test`/`typecheck`/`lint` filters and the `packages/cms` layout this plan copies. **Start only after #951 has merged into `develop`.** Branch from `develop`.

## Global Constraints

- **blog.brianlusina.com changes in no way a reader could notice.** The blog parity suite stays green on the preview with no re-recorded baselines (`e2e/baseline/*`, `e2e/**/__screenshots__`).
- **The blog keeps its own header, footer and theme storage until after cutover (#930).** It keeps `next-themes` with `localStorage.theme`, its own `Navbar` and its own `Footer`. This PR does not adopt the shared theme (spec §2).
- `packages/ui` has no `react-router` import.
- **Stay on Tailwind 3 until both apps upgrade together** (#927).
- **No speculative shadcn primitives.** `apps/blog/scripts/ui-primitives-policy.spec.ts` allows only primitives some app imports; the sites add theirs with the first page that uses them (P8–P11).
- Unit coverage ≥ 85% lines per package and app.
- bun only. Dependencies go in with `bun add --cwd <workspace>` at the versions already in `bun.lock`. No incidental upgrades: if `bun add` bumps a version, restore the lockfile and run `bun install` (the P3 ruling).
- Pushes go only to the working branch. Never to `staging` or `production`.

## Scope decisions (where this departs from #927's wording)

| #927 lists | Decision | Why |
|---|---|---|
| `Navbar` | **Stays in the blog** | It holds the blog's nav items, newsletter flag and search launcher. The shared header is P8 (spec §5.1) and the blog adopts it only after cutover (spec §2). |
| `SearchDialog` | **Stays in the blog** | It is the blog's search feature: search hooks, analytics and routes. Folio search is later, behind `folio-search` (spec §5.3). |
| `ScrollToTop` | **Stays in the blog** | It resets scroll on client-side route changes. Astro pages do full navigations, so the browser already does this. |
| `ButtonLink`, `Elements/Link` | **Stay in the blog** | `ButtonLink` renders the legacy `.button` class from the retired SCSS (`main.scss` is commented out). Only `PostItem` uses it, and the sites don't need it. |
| Theme "fixes #829 for both apps" | **Sites only, now** | Spec §2 defers the blog's switch from `localStorage.theme` to the cookie until after cutover, as a separately approved change. |
| "shadcn primitives the sites need" | **None now** | The primitives policy above. `Button` moves because `ArticleCard`'s callers and the sites' hero need it (P10). |

`ArticleCard`, `Tag`/`Tags` and `Button` move to the package. Home's featured posts (P10) need `ArticleCard`, linking across origins to the blog. Folio's stack labels (P11) need `Tag`.

## Review Focus

1. **Classes used only inside `packages/ui` missing from an app's CSS.** Tailwind generates only the classes it finds in `content`, so a moved component can render unstyled. The test is the byte-identical CSS check in Tasks 1 and 2.
2. **The theme cookie on hosts outside `brianlusina.com`.** On `*.vercel.app` previews, `localhost` and Docker hosts, `Domain=.brianlusina.com` is silently rejected and the choice never sticks. The test is `themeCookieDomain` in Task 3.
3. **A missing or garbage `theme` cookie.** The pre-paint script must fall back to the system preference and never throw, because an exception there skips the rest of the inline script. The test is the `themeScript` cases in Task 3.
4. **Components rendered with no `LinkProvider`** (Astro, Storybook, tests) render a plain `<a href>` that works. The test is in Task 2.
5. **Blog navigation through a moved component stays client-side.** Clicking an `ArticleCard` in the blog must not reload the page. The test is in Task 2 (`MockAppWithRouter`), plus the parity suite on the preview.

---

### Task 1: Scaffold `@brianlusina/ui`; move the tokens and the Tailwind preset; prove the blog's CSS is unchanged

**Files:**
- Create:
  - `packages/ui/package.json`, `tsconfig.json`, `vitest.config.ts`
  - `packages/ui/styles.css`, moved with `git mv` from `apps/blog/src/styles/css/index.css`
  - `packages/ui/tailwind-preset.ts`
  - `packages/ui/tailwind-preset.spec.ts`
- Modify:
  - `apps/blog/package.json`: add `"@brianlusina/ui": "workspace:*"`
  - `apps/blog/tailwind.config.ts`
  - `apps/blog/src/styles/css/index.css`: becomes one `@import`
  - `apps/blog/components.json`: `tailwind.css` still points at the blog file, so `shadcn add` keeps working
  - `eslint.config.js`, only if the package needs the `**/coverage` ignore (already added in P3)

**Interfaces:**
- Produces:
  - `@brianlusina/ui/styles.css`: the design system. It contains the `@tailwind` directives, the `:root` and `.dark` variables, base styles, utilities and keyframes, byte for byte as the blog has them today.
  - `@brianlusina/ui/tailwind-preset` (default export, a `Partial<Config>`): `darkMode: ['class']`, the container, `fontFamily`, `colors`, `borderRadius`, and `plugins: [tailwindcssAnimate]`, as in today's `apps/blog/tailwind.config.ts`.
  - `uiContent: string[]` (a named export of the preset module): absolute globs for `packages/ui/src/**/*.{ts,tsx}`, built from `__dirname`. Every app adds it to its `content`.

- [ ] **Step 1: Record the baseline CSS.** On the base branch, run `bun run build`, then `cp apps/blog/dist/assets/index-*.css <workspace>/blog-before.css`. This is the oracle for Steps 6 and Task 2.
- [ ] **Step 2: Package scaffold.** Copy the shape of `packages/cms` (no `exports` or `"type"` field; `main`/`types` → `index.ts`) with:
  - scripts `test`, `test:coverage`, `typecheck` and `lint`;
  - `vitest.config.ts` with `environment: 'jsdom'`, `globals: true`, coverage on `src/**/*.{ts,tsx}` excluding specs and stories, and `thresholds: { lines: 85, statements: 85 }`;
  - `tsconfig.json` with `jsx: "react-jsx"`, `lib: ["es2022", "dom"]` and `types: ["vitest/globals", "@testing-library/jest-dom"]`;
  - dependencies, at the blog's locked versions: `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge` and `lucide-react`;
  - `react` and `react-dom` as `peerDependencies`;
  - `tailwindcss` and the test libraries as `devDependencies`.

  Then run `bun install`. Expected: a lockfile diff that only adds the workspace.
- [ ] **Step 3: Failing preset test** (`tailwind-preset.spec.ts`):
  - `preset.darkMode` equals `['class']`;
  - `preset.theme.extend.colors.background` is `'hsl(var(--background))'`;
  - `preset.theme.extend.fontFamily.serif[0]` is `'Merriweather'`;
  - `preset.theme.extend.borderRadius.lg` is `'var(--radius)'`;
  - `preset.plugins` has length 1;
  - every entry of `uiContent` is absolute and ends with `src/**/*.{ts,tsx}`.

  Run `bun run --filter @brianlusina/ui test`. Expected: FAIL, module not found.
- [ ] **Step 4: Implement `tailwind-preset.ts`** by moving everything except `content` and `prefix` out of `apps/blog/tailwind.config.ts`. Run the test. Expected: PASS.
- [ ] **Step 5: Wire the blog.**
  - `git mv apps/blog/src/styles/css/index.css packages/ui/styles.css`.
  - Recreate `apps/blog/src/styles/css/index.css` as the single line `@import '@brianlusina/ui/styles.css';`. `main.tsx` and `.storybook/preview.tsx` keep importing the blog file.
  - `apps/blog/tailwind.config.ts` becomes `{ presets: [preset], content: [...today's globs, ...uiContent], prefix: '' }`.
- [ ] **Step 6: The CSS identity gate (Review Focus 1).** Run `bun run build`, then:

  ```bash
  cmp <workspace>/blog-before.css apps/blog/dist/assets/index-*.css
  ```

  Expected: no output. Tailwind's minified output is deterministic. Any difference is a real change. Fix the wiring, not the oracle.

  If Vite inlines the `@import` after Tailwind has run, the `@layer` blocks fail with "`@layer base` is used but no matching `@tailwind base`". In that case, use the ruled fallback: keep the three `@tailwind` directives in the blog's `index.css`, remove them from `styles.css`, and add `postcss-import` as the first PostCSS plugin. Record it in the ledger.
- [ ] **Step 7: Verify** that everything passes:
  - `bun run test`, `test:coverage`, `typecheck`, `lint`, `lint:styles`, `build`, `check:bundle-size` and `storybook:build`;
  - the blog's Storybook still renders styled (build it and open one story's iframe HTML: it links a CSS file that contains `--background`).
- [ ] **Step 8: Commit** (`feat(ui): add @brianlusina/ui with the blog's tokens and Tailwind preset`, `Refs #927`). Push.

  Gate: the preview's E2E run is green with **no** baseline or screenshot changes.

### Task 2: Router-agnostic links; move `Button`, `ArticleCard` and `Tag`

**Files:**
- Create:
  - `packages/ui/index.ts`
  - `packages/ui/src/lib/cn.ts`
  - `packages/ui/src/link/LinkProvider.tsx` and `LinkProvider.spec.tsx`
- Move with `git mv`, keeping their specs and stories:
  - `apps/blog/src/components/Elements/Button/*` → `packages/ui/src/button/`
  - `apps/blog/src/components/ArticleCard/*` → `packages/ui/src/article-card/`
  - `apps/blog/src/components/ui/tag/*` → `packages/ui/src/tag/`
- Modify:
  - `apps/blog/src/components/index.ts`: re-export `Button`, `buttonVariants` and `ButtonProps` from the package
  - every blog importer of `ArticleCard` and `Tag`/`Tags` (`grep -rn "ArticleCard\|ui/tag" apps/blog/src`)
  - `apps/blog/src/main.tsx` (the provider)
  - `apps/blog/src/test/MockAppWithRouter.tsx` (the provider, so blog specs navigate through the router)
  - `apps/blog/src/lib/utils.ts`: `cn` and `getCategoryClass` move to the package, with their spec cases. `utils.ts` re-exports both, because `ArticleHeader` and shadcn's `@/lib/utils` alias still import them there.
  - `apps/blog/scripts/repo-policy.spec.ts`

**Interfaces:**
- Consumes: `uiContent` and the preset from Task 1.
- Produces, from `@brianlusina/ui`:
  - `type LinkProps = { href: string; className?: string; children: ReactNode; onClick?: MouseEventHandler<HTMLAnchorElement>; 'aria-label'?: string }`.
  - `LinkProvider: FC<{ component: ComponentType<LinkProps>; children: ReactNode }>`.
  - `Link: FC<LinkProps>`: renders the provided component, or an `<a href>` with the same props when there is none.
  - `cn(...inputs: ClassValue[]): string`, the blog's `cn`, moved. The blog's `@/lib/utils` re-exports it, so shadcn's alias keeps working.
  - `Button`, `buttonVariants`, `type ButtonProps`, moved unchanged.
  - `ArticleCard: FC<{ href: string; title: string; category: string; date: string; thumbnail?: string; size?: 'small' | 'large'; onClick?: () => void }>`. Today's props, with `href` replacing `id` and `slug`. The blog passes `` `/article/${id}/${slug}` `` and home passes an absolute blog URL.
  - `Tag: FC<{ name: string; href: string }>` and `Tags: FC<{ tags: string[]; hrefFor: (name: string) => string }>`. The blog passes `` name => `${ARTICLE_PAGE_BY_TAGS_ROUTE}/${encodeURIComponent(name)}` ``.
  - `getCategoryClass(category: string): string`, moved unchanged.

- [ ] **Step 1: Failing tests.** In `LinkProvider.spec.tsx`:
  - "renders an anchor with the href when no provider is given" (Review Focus 4): `render(<Link href="/a">x</Link>)` gives `getByRole('link', { name: 'x' })` with `href="/a"`.
  - "renders the provided component with every prop": a stub component records its props, and the test asserts `href`, `className`, `onClick` and `aria-label` arrive unchanged.

  Run the package tests. Expected: FAIL.
- [ ] **Step 2: Implement** `cn`, `LinkProvider`/`Link` and `index.ts`. Run. Expected: PASS.
- [ ] **Step 3: Move the components.** `git mv` each one with its spec and story. Replace the `react-router-dom` imports with `Link` from `../link/LinkProvider`, and the `@/…` aliases with relative imports. Apply the prop changes under Interfaces. The moved specs drop `MemoryRouter` and assert `href` (e.g. `ArticleCard` renders `getByRole('link')` with `href="/article/1/x"`).

  Run the package tests and `bun run --filter @brianlusina/ui test:coverage`. Expected: PASS, ≥ 85% lines.
- [ ] **Step 4: Blog adapter (Review Focus 5).**
  - Add `const RouterLink = ({ href, ...props }: LinkProps) => <ReactRouterLink to={href} {...props} />` in `apps/blog/src/components/Elements/Link/RouterLink.tsx`.
  - Wrap the app's router children in `<LinkProvider component={RouterLink}>` in `main.tsx` and `MockAppWithRouter.tsx`.
  - Update the callers.
  - Add a blog spec in `apps/blog/src/components/Elements/Link/RouterLink.spec.tsx`. Under `MockAppWithRouter` with a memory history, clicking an `ArticleCard` changes the router location to `/article/1/x` without `window.location.assign`. Spy on it and expect no calls.

  Run `bun run test`. Expected: PASS.
- [ ] **Step 5: Policy test.** In `repo-policy.spec.ts`, add "packages/ui has no react-router import": scan `packages/ui/**/*.{ts,tsx}` and expect no `react-router` specifier. Check it bites: add one temporarily, see the test fail, revert.
- [ ] **Step 6: Verify.**
  - Rerun the CSS identity gate from Task 1, Step 6. Expected: no diff (Review Focus 1, now with the moved components).
  - Then run the full list from Task 1, Step 7.
  - Run `grep -rn "react-router" packages/ui`. Expected: nothing.
- [ ] **Step 7: Commit** (`feat(ui): router-agnostic Link; move Button, ArticleCard and Tag to @brianlusina/ui`, `Refs #927`). Push.

  Gate: the preview E2E is green with no baseline changes.

### Task 3: Cross-site theme for the sites (cookie, no-flash script, toggle)

**Files:**
- Create in `packages/ui/src/theme/`:
  - `themeCookie.ts` and `themeCookie.spec.ts`
  - `themeScript.ts` and `themeScript.spec.ts`
  - `ThemeToggle.tsx`, `ThemeToggle.spec.tsx` and `ThemeToggle.stories.tsx`
- Modify: `packages/ui/index.ts`

**Interfaces:**
- Produces, from `@brianlusina/ui`:
  - `type Theme = 'light' | 'dark'`.
  - `THEME_COOKIE = 'theme'`.
  - `themeCookieDomain(hostname: string): string | undefined`: `'.brianlusina.com'` when `hostname` is `brianlusina.com` or ends with `.brianlusina.com`, otherwise `undefined` (host-only).
  - `serializeThemeCookie(theme: Theme, location: { hostname: string; protocol: string }): string`: `theme=<v>; Path=/; Max-Age=31536000; SameSite=Lax`, plus `; Domain=…` when `themeCookieDomain` gives one and `; Secure` on `https:`.
  - `readThemeCookie(cookie: string): Theme | undefined`: any value other than `light` or `dark` is `undefined`.
  - `themeScript: string`: an inline script for `<head>`, run before paint. It applies the `dark` class to `document.documentElement` when the cookie says `dark`, or when there is no valid cookie and `matchMedia('(prefers-color-scheme: dark)')` matches. It never throws.
  - `ThemeToggle: FC<{ className?: string }>`: a button labelled "Toggle theme" with the blog's Sun/Moon icons and classes. On click it flips the `dark` class and writes the cookie. With no cookie, it starts from the current class.

- [ ] **Step 1: Failing tests.**
  - `themeCookie.spec.ts` (Review Focus 2):
    - `themeCookieDomain`: `brianlusina.com`, `folio.brianlusina.com` and `staging.blog.brianlusina.com` → `'.brianlusina.com'`; `journal-abc.vercel.app`, `localhost`, `folio.localhost` and `notbrianlusina.com` → `undefined`.
    - `serializeThemeCookie('dark', { hostname: 'folio.brianlusina.com', protocol: 'https:' })` contains `Domain=.brianlusina.com` and `Secure`.
    - On `{ hostname: 'localhost', protocol: 'http:' }` it contains neither.
    - `readThemeCookie('a=1; theme=dark')` is `'dark'`; `'theme=purple'` and `''` → `undefined`.
  - `themeScript.spec.ts` (Review Focus 3) runs the string with `new Function(themeScript)()` under jsdom. Stub `document.cookie` and `window.matchMedia` per case:
    - cookie `dark` → `<html>` has `dark`;
    - cookie `light` with a dark system preference → no `dark`;
    - no cookie with a dark system → `dark`;
    - `theme=%%%` → falls back to the system preference;
    - with `window.matchMedia` undefined → no throw and no `dark`.
  - `ThemeToggle.spec.tsx`: clicking toggles the `dark` class on `document.documentElement` and sets `document.cookie` to include `theme=dark`, then `theme=light`. The button has the accessible name "Toggle theme".

  Run them. Expected: FAIL.
- [ ] **Step 2: Implement.** `themeScript` is a self-contained IIFE string wrapped in `try/catch`, with no imports, so it can be inlined by Astro. Run the tests and package coverage. Expected: PASS, ≥ 85%.
- [ ] **Step 3: Verify** with the list from Task 1, Step 7, then commit (`feat(ui): cross-site theme cookie, no-flash script and toggle for the sites`, `Refs #927`). Push.

  The blog does not import any of it, so the preview E2E must stay green unchanged.

### Task 4: Storybook from the package; docs; final gates

**Files:**
- Create:
  - `packages/ui/.storybook/main.ts`: `@storybook/react-vite`, stories in `../src/**/*.stories.@(ts|tsx)`, and a `viteFinal` that adds a PostCSS config with Tailwind on `{ presets: [preset], content: uiContent }`
  - `packages/ui/.storybook/preview.tsx`: imports `../styles.css`, with a light/dark toolbar toggle that sets the `dark` class
- Modify:
  - `packages/ui/package.json`: `storybook:dev`, `storybook:build`; Storybook devDeps at the blog's versions
  - root `package.json`: `storybook:build` runs both workspaces with `--filter './packages/*' --filter './apps/*'`, like `test`
  - `.github/workflows/build_app.yml`, only if it builds Storybook by workspace name
  - `docs/ARCHITECTURE.md` (a "Design system" section), `README.md` and `AGENTS.md`

- [ ] **Step 1: Storybook.** Run `bun run --filter @brianlusina/ui storybook:build`. Expected: success, with stories for Button, ArticleCard, Tag and ThemeToggle.

  Check the built iframe's CSS contains `--background` and an `ArticleCard` class such as `rounded-[2.5rem]`. Together these prove the preset and `uiContent` work outside the blog. This is the "Storybook runs from the package" acceptance in #927.
- [ ] **Step 2: Docs.**
  - **ARCHITECTURE:**
    - what lives in `packages/ui` (styles, preset, `uiContent`, `LinkProvider`, the components, the theme);
    - how an app consumes it: `@import` the styles, `presets` plus `content: [...uiContent]`, and wrap the app in a `LinkProvider` when it has a client router;
    - the theme contract: a `theme` cookie on `.brianlusina.com`, host-only elsewhere; inline `themeScript` in `<head>`;
    - that the blog keeps `next-themes` until after cutover (§2);
    - that new shadcn primitives arrive with the first page that uses them (the policy test).
  - **AGENTS.md:** shared UI goes in `packages/ui` with a spec and a story; app-only components stay in the app.
- [ ] **Step 3: Final gates.**
  - The full list from Task 1, Step 7.
  - The CSS identity gate.
  - `bunx playwright test --project=lib --trace off`.
- [ ] **Step 4: Commit** (`docs: describe @brianlusina/ui and the theme contract`, `Refs #927`). Push.

  Gate: the preview E2E is green with no baseline changes. Ask Brian before opening the PR against `develop`.
