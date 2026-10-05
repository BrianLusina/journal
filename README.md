# LJournal

[![CircleCI](https://circleci.com/gh/BrianLusina/brianlusina.github.io.svg?style=svg)](https://circleci.com/gh/BrianLusina/brianlusina.github.io)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Personal blog and journal built with [React](https://react.dev/), [Vite](https://vitejs.dev/) and [Tailwind CSS](https://tailwindcss.com/). Posts come from more than one headless CMS: [Contentful](https://www.contentful.com/) today, with [Notion](https://developers.notion.com/) added through a CMS adapter layer.

How the code is organised, how content flows from each CMS to the page, and how to add another content source are covered in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

**Why document and open source my blog site?**

Part of the belief that OSS is the future and also fosters a community of developers, on top of which not only allows growth, but learnings. And with any OSS, it is important that a document is created to allow contributors to jump on board easily.

## Getting Started

### Prerequisites

1. [Node.js](https://nodejs.org/) at the version in [.nvmrc](./.nvmrc) (22.x). Jest and the Vite tooling run on Node.
2. [Bun](https://bun.sh), the package manager and script runner. The lockfile is `bun.lockb`.

### Package manager

This project uses **[bun](https://bun.sh) only** (version pinned in `packageManager` in [package.json](./package.json)), with `bun.lockb` as the single lockfile. It moved off yarn during the Vite migration, so `yarn.lock` has been removed and is git-ignored together with `package-lock.json` and `pnpm-lock.yaml`. Install, add and remove dependencies with `bun install`, `bun add` and `bun remove` so `bun.lockb` stays in sync. Mixing in npm or yarn would create a second, divergent lockfile. CI installs with `bun install --frozen-lockfile` and fails if `bun.lockb` is out of date.

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
bun dev          # Vite dev server on http://localhost:8080 (Contentful only)
vercel dev       # Vite plus the api/notion functions, needed for Notion content
```

`bun dev` does not run the `api/` functions, so Notion posts only appear under `vercel dev` (see BrianLusina/journal#802).

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

### Vercel and Notion

The Notion integration uses Vercel Functions under `/api/notion`. Configure these server-only environment variables in the Vercel project settings:

```text
NOTION_API_KEY
NOTION_DATABASE_ID
```

Do not prefix either variable with `VITE_`, because Vite exposes `VITE_*` variables to the browser. For local development, put the same variables in `.env.local` and run `vercel dev` so the Vite app and the API functions share one origin. The Notion integration must have access to the configured database (or data source) in Notion. BrianLusina/journal#798 tracks the difference between the two IDs.

A static-only host (Surge, the nginx [Dockerfile](./Dockerfile), GitHub Pages) can serve the app with Contentful content only. BrianLusina/journal#807 tracks the Docker and older deploy workflows, which still need porting to bun.

## Built With

1. [TypeScript](https://www.typescriptlang.org/)
2. [React 18](https://react.dev/) and [React Router 6](https://reactrouter.com/)
3. [Vite](https://vitejs.dev/) with SWC
4. [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
5. [Apollo Client](https://www.apollographql.com/docs/react/) for Contentful GraphQL
6. [Notion API](https://developers.notion.com/) through [Vercel Functions](https://vercel.com/docs/functions)
7. [Sentry](https://sentry.io/) for monitoring and [Firebase Analytics](https://firebase.google.com/docs/analytics)

## Versioning

[SemVer](https://semver.org/) is used for versioning. For the versions available, see the [tags](https://github.com/BrianLusina/journal/tags) on this repository.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

A hat tip to [Unsplash](https://unsplash.com) for images and [Html5Up](https://html5up.net) for themes.
