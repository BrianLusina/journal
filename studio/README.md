# Sanity Studio

Where Sanity posts are written. It reads and writes the `Yggdrasil` project; the blog reads published posts through `packages/cms` (see "Sanity schema" in `docs/ARCHITECTURE.md`).

Studio is outside the repository's bun workspace, because it needs React 19 and the blog is on React 18. Run everything here, in `studio/`.

## Run it locally

```bash
bun install
```

```bash
SANITY_STUDIO_PROJECT_ID=<project id> bun run dev
```

`SANITY_STUDIO_DATASET` picks the dataset (default `staging`). From the repository root, `make sanity.run.studio.dev` does the same.

## Change the schema

The types are in `schemaTypes/`. `packages/cms` can't import them, so it reads `schema.json` instead. After any change:

```bash
SANITY_STUDIO_PROJECT_ID=<project id> bun run schema:extract
```

Commit the new `schema.json`, and update `packages/cms/src/sanity/projection.ts`, `map.ts` and the schema table in `docs/ARCHITECTURE.md` with it. CI fails when `schema.json` is out of date, and `packages/cms` fails when a projection reads a field the schema doesn't declare.

## Deploys

`.github/workflows/ci_sanity_studio.yml` type-checks and builds Studio on every push, and deploys only from two branches:

| Branch | GitHub Environment | Dataset |
|---|---|---|
| `staging` | `staging` | `staging` |
| `production` | `production` | `production` |

Each Environment holds that Studio's `SANITY_STUDIO_DATASET` (a variable, equal to the branch name), plus `SANITY_STUDIO_HOSTNAME`, `SANITY_STUDIO_APP_ID` and `SANITY_AUTH_TOKEN` (secrets). The repository secret `SANITY_STUDIO_PROJECT_ID` is shared. The deploy refuses to run when the Environment's dataset isn't the branch name.
