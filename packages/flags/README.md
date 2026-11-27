# @brianlusina/flags

Typed feature flags for every app: one registry per app, resolved **remote → env → default**. A provider that throws, or takes longer than `FLAG_PROVIDER_TIMEOUT_MS` (300 ms), is skipped, so a flag service outage never breaks a page. There are no runtime dependencies.

```ts
import { defineFlags, resolveFlags, edgeConfigProvider, envProvider } from '@brianlusina/flags';

const FLAGS = defineFlags({ analytics: { default: false, description: 'GA4 behind consent', sites: ['home', 'folio'] } });
const flags = await resolveFlags({ analytics: false }, [edgeConfigProvider(process.env.EDGE_CONFIG), envProvider(process.env.SITES_FEATURES, ['analytics'])]);
```

- **`parseFlagList(raw, names, warn?)`** reads a list such as `search=on,newsletter=off`:
  - a value is `on`/`off`, `true`/`false` or `1`/`0`, in any case;
  - a bare name means on;
  - an unknown name or value, or a malformed entry, is skipped and passed to `warn`;
  - a later entry wins.
- **`envProvider(raw, names, warn?)`** wraps `parseFlagList` as a provider.
- **`edgeConfigProvider(connection)`** reads a Vercel Edge Config store with the REST API over `fetch` (no SDK). `connection` is the `EDGE_CONFIG` connection string. Values that aren't booleans are ignored, flag by flag. A missing store, a failed request or a malformed body reads as no flags, never an error.
  - **Read budget:** Hobby allows 100,000 reads a month, and pauses the store for the rest of the 30-day window if exceeded. Each read is cached for `EDGE_CONFIG_TTL_MS` (5 minutes) per server instance, so an instance makes at most 288 reads a day. A dozen always-warm instances stay under the limit.
  - **Where to read it:** at render, never in middleware, which runs on every request.

## apps/sites

`apps/sites/src/flags.ts` holds the sites' registry, and `siteFlags(site)` resolves it: Edge Config (`EDGE_CONFIG`), then `SITES_FEATURES`, then the defaults. `src/layouts/Site.astro` calls it while a page renders; `src/flags.spec.ts` keeps it out of the middleware.

| Flag | Default | Sites | Gates |
|---|---|---|---|
| `analytics` | off | home, folio | GA4 behind the consent banner (see "Analytics and consent" in `docs/ARCHITECTURE.md`). Vercel Web Analytics runs regardless. |

Turn a flag on per environment with `SITES_FEATURES=analytics=on` on the `yggdrasil` Vercel project (it takes effect on the next deployment), or instantly with `{ "analytics": true }` in the Edge Config store connected to it (within the 5-minute cache).

## The blog

The blog keeps env flags, read once at page load from `VITE_FEATURES` through `parseFlagList`, so it needs no extra request and has nothing that can be down. Its registry is `FEATURE_DEFAULTS` in `apps/blog/src/config/features.ts` (paths below are relative to `apps/blog/`).

Feature flags turn a feature on or off per environment without a code change. They ride on the same `readEnv` path as the rest of the configuration, so they are known before the first render: no extra request, no flicker, and nothing that can be down.

| Flag | Default | Gates |
|---|---|---|
| `newsletter` | off | The newsletter signup: `NewsLetterSection` on the home page, `NewsLetterCTA` after articles, and the "Join Our Community" section on the About page. |
| `search` | off | Site search (see [Search](../../docs/ARCHITECTURE.md#search)): the navbar search button and its shortcuts, and the `/search` page, which is not found while the flag is off. The dialog and the search index load with `lazy()` and `import()` on first use, the dialog inside its own `ErrorBoundary`, so a chunk that fails again after the one reload (see [Error handling and observability](../../docs/ARCHITECTURE.md#error-handling-and-observability)) drops the dialog, not the navbar. |
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
