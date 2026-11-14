# Personal sites: plan roadmap

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` · **Tracking:** #924

The spec spans several subsystems, and later ones depend on file paths that only exist after earlier ones land (the workspace move renames everything). So it's delivered as a series of plans, each producing working, tested software on its own. **Each plan is written when its prerequisites have merged**, against the code as it is then, not guessed in advance.

| # | Plan | Issue(s) | Needs | Status |
|---|---|---|---|---|
| P1 | Blog parity baseline (Playwright, URL inventory, visual, axe, CI on previews, scheduled production smoke) | #925 | — | **Written:** `2026-11-12-blog-parity-baseline.md` |
| P2 | Bun workspace: move the app to `apps/blog`, root scripts, Vercel root dir, CI, Docker | #926 | P1 merged and green | To write |
| P3 | `packages/cms` (models, adapters and aggregator server-side; routes return unified models) | #927 | P2 | To write |
| P4 | `packages/ui` (tokens, Tailwind preset, router-agnostic components, theme) | #927 | P2 | To write (can run beside P3) |
| P5 | `apps/sites` skeleton: Astro, site registry, hostname middleware, preview override, Vercel project, Playwright `home`/`folio` projects | #928 | P3, P4 | To write |
| P6 | Sanity adapter (posts) + Studio schema | #929 | P3 | To write (beside P5) |
| P7 | Platform packages: `packages/flags` (env + Edge Config), `packages/analytics` (Vercel WA + GA4) + consent banner, `packages/media` (Cloudinary) | #931, #932, #933 | P5 | To write |
| P8 | Shared chrome and forms for sites: header, footer, 404, privacy, contact handler + form | #934, #935 | P5, P7 | To write |
| P9 | Projects: `UnifiedProject`, `.portfolio.md` schema + template + reusable workflow, GitHub adapter, Sanity project adapter, revalidate endpoint | #936 (do early: unblocks Brian), #937, #938 | P3, P6, P7 | To write |
| P10 | Home: hero, experience timeline, featured projects, featured posts (`featured` in sources) | #939 | P8, P9 | To write |
| P11 | Folio: project list with filters, detail pages, old-URL redirects | #940 | P8, P9 | To write |
| P12 | Cutover gates: Lighthouse budgets, bundle/secret/placeholder guard, PII guard for page HTML and API responses, scheduled smoke for all domains, Sentry site tags, uptime monitor | #941 | P10, P11 | To write |
| P13 | After cutover: résumé PDF + its PII check, share images, draft preview | #942, #943, #944 | P10, P11 | To write |
| — | DNS cutover and archiving (runbook, mostly manual) | #930 | P12 | Runbook in #930 |
| — | Blog adopts shared pieces (each a separately approved change) | later issues | #930 | Not planned yet |

Out-of-repo work (Brian) follows §9 of the spec. The ordering constraint that matters most: the Notion and Contentful `featured` fields must exist before P10 deploys.
