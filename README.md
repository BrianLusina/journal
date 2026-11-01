# Journal

[![CircleCI](https://circleci.com/gh/BrianLusina/brianlusina.github.io.svg?style=svg)](https://circleci.com/gh/BrianLusina/brianlusina.github.io)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Personal blog and journal built with [React](https://react.dev/), [Vite](https://vitejs.dev/) and [Tailwind CSS](https://tailwindcss.com/). Posts come from more than one headless CMS, [Contentful](https://www.contentful.com/) and [Notion](https://developers.notion.com/), both read through Vercel Functions behind a CMS adapter layer.

How the code is organised, how content flows from each CMS to the page, and how to add another content source are covered in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

**Why document and open source my blog site?**

Part of the belief that OSS is the future and also fosters a community of developers, on top of which not only allows growth, but learnings. And with any OSS, it is important that a document is created to allow contributors to jump on board easily.

## Getting Started

### Prerequisites

1. [Node.js](https://nodejs.org/) at the version in [.nvmrc](./.nvmrc) (22.x). Jest and the Vite tooling run on Node.
2. [Bun](https://bun.sh), the package manager and script runner. The lockfile is the text `bun.lock`.

### Package manager

This project uses **[bun](https://bun.sh) only** (version pinned in `packageManager` in [package.json](./package.json)), with the text `bun.lock` as the single lockfile (bun's older binary `bun.lockb` is no longer used, since Dependabot can only update the text format). It moved off yarn during the Vite migration, so `yarn.lock` has been removed and is git-ignored together with `package-lock.json` and `pnpm-lock.yaml`. Install, add and remove dependencies with `bun install`, `bun add` and `bun remove` so `bun.lock` stays in sync. Mixing in npm or yarn would create a second, divergent lockfile. CI installs with `bun install --frozen-lockfile` and fails if `bun.lock` is out of date. `scripts/repo-policy.spec.ts` fails the test suite if any other lockfile is committed.

### Installing

```bash
git clone https://github.com/BrianLusina/journal.git
cd journal
bun install
cp .env.sample .env.local   # then fill in the values you have
```

Every variable in `.env.sample` is described in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#configuration). Firebase and Sentry settings are optional. Without Contentful settings the app still renders, but with no Contentful posts.

### Running locally

```bash
bun dev          # Vite dev server on http://localhost:8080, proxies /api/* to vercel dev
vercel dev       # the api/ functions on http://localhost:3000, needed for Contentful and Notion posts
```

`bun dev` does not run the `api/` functions itself. It forwards `/api/*` to `vercel dev` on port 3000 (override with `API_PROXY_TARGET`), so run both and open http://localhost:8080 (see BrianLusina/journal#802).

## Running tests

Tests use [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), with specs next to the code they test (`*.spec.ts(x)`).

```bash
bun run test            # Jest
bun run test:coverage   # Jest with the 85% coverage gate CI enforces
```

Use `bun run test`, not `bun test`. `bun test` starts Bun's own test runner, which ignores `jest.config.js` and fails.

Linting and building:

```bash
bun run lint          # ESLint
bun run lint:styles   # stylelint
bun run build         # production build into dist/
```

## Deployment

The build output in `dist/` is a static single-page app. Every pull request gets a Vercel preview deployment.

### Vercel and Contentful

Posts are read from Contentful through Vercel Functions under `/api/contentful`. Configure these server-only environment variables in the Vercel project settings (the same values as the `VITE_CONTENTFUL_CMS_*` ones, without the prefix):

```text
CONTENTFUL_CMS_API_KEY
CONTENTFUL_CMS_SPACE_ID
CONTENTFUL_CMS_ENVIRONMENT       # optional, defaults to master
CONTENTFUL_CMS_GRAPHQL_URL       # optional, defaults to https://graphql.contentful.com
CONTENTFUL_CMS_REST_API_URL      # optional, defaults to https://cdn.contentful.com
```

Without them `/api/contentful/posts` answers 500, `/api/contentful/posts/:slug` answers 404, and the site shows no Contentful posts. The `VITE_CONTENTFUL_CMS_*` variables are still read by the browser for authors, About and Social content.

### Vercel and Notion

The Notion integration uses Vercel Functions under `/api/notion`. Configure these server-only environment variables in the Vercel project settings:

```text
NOTION_API_KEY
NOTION_DATA_SOURCE_ID   # preferred
NOTION_DATABASE_ID      # alternative: the database's first data source is used
```

Since Notion API version 2025-09-03, queries target a database's *data source*, whose ID differs from the database ID. Copy it from the database's data source settings in Notion; it is not the ID in the database URL. If only `NOTION_DATABASE_ID` is set, the functions look up its first data source once per instance. A value that is already a data source ID also keeps working.

Do not prefix any of these variables with `VITE_`, because Vite exposes `VITE_*` variables to the browser. For local development, put the same variables in `.env.local` and run `vercel dev` so the Vite app and the API functions share one origin. The Notion integration must have access to the database in Notion.

Production deploys through the Vercel GitHub integration. On pushes to `staging` and `production`, GitHub Actions also tags a release with semantic-release (`release.yml`) and publishes the Docker image to `ghcr.io/brianlusina/journal` (`dockerimage.yml`), tagged with the branch and the commit SHA. Vercel's build uploads source maps to Sentry when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set in the Vercel project.

### Docker

The [Dockerfile](./Dockerfile) builds an image that runs the whole app, including the `api/` functions, on a small Bun server (`server/`). It reads its configuration from the container's environment when it starts, so one image runs in every environment:

- **Client:** the `VITE_*` variables in `.env.sample`, set in the page the server sends. Only an allowlist of the keys the app reads is sent; never put a secret in a `VITE_*` variable.
- **Server only:** `CONTENTFUL_CMS_API_KEY` with `CONTENTFUL_CMS_SPACE_ID`, `NOTION_API_KEY` with `NOTION_DATA_SOURCE_ID` (or `NOTION_DATABASE_ID`), plus `RESEND_*` and `CONTACT_*` for the contact and newsletter forms. These never reach the browser.
- `PORT` (optional, default 8080).

```bash
docker build -t journal .
docker run --rm -p 8080:8080 \
  -e VITE_ENV=production \
  -e VITE_CONTENTFUL_CMS_SPACE_ID=... \
  -e VITE_CONTENTFUL_CMS_API_KEY=... \
  -e CONTENTFUL_CMS_API_KEY=... \
  -e CONTENTFUL_CMS_SPACE_ID=... \
  -e NOTION_API_KEY=... \
  -e NOTION_DATA_SOURCE_ID=... \
  journal
```

Or pass a file of the same variables with `--env-file`. `/healthz` answers `ok` for health checks. To try the server without Docker, run `bun run build` and then `bun server/index.ts`.

A static-only host (GitHub Pages) does not run `api/`, so it serves no posts: only authors, About and Social content, which are still read from Contentful in the browser.

### Feature flags

Some features are switched per environment with the `VITE_FEATURES` variable, a comma-separated list of overrides. The newsletter signup is off unless it is turned on:

```bash
VITE_FEATURES=newsletter=on
```

| Flag | Default | Turns on or off |
|---|---|---|
| `newsletter` | off | The newsletter signup on the home, article and About pages |
| `search` | off | The search menu (still a stub) |
| `notion` | on | Notion as a post source |

On Vercel, set it for Production and Preview separately and redeploy; it is read at build time. In Docker, pass it with `-e` and restart the container. Unknown names and values are ignored. See [Feature flags](./docs/ARCHITECTURE.md#feature-flags) for how to add or remove a flag.

## Built With

1. [TypeScript](https://www.typescriptlang.org/)
2. [React 18](https://react.dev/) and [React Router 6](https://reactrouter.com/)
3. [Vite](https://vitejs.dev/) with SWC
4. [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
5. [Apollo Client](https://www.apollographql.com/docs/react/) for Contentful authors, About and Social content
6. [Contentful](https://www.contentful.com/developers/docs/references/graphql/) and [Notion API](https://developers.notion.com/) posts through [Vercel Functions](https://vercel.com/docs/functions)
7. [Sentry](https://sentry.io/) for monitoring and [Firebase Analytics](https://firebase.google.com/docs/analytics)

## Versioning

[SemVer](https://semver.org/) is used for versioning. For the versions available, see the [tags](https://github.com/BrianLusina/journal/tags) on this repository.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

A hat tip to [Unsplash](https://unsplash.com) for images and [Html5Up](https://html5up.net) for themes.
