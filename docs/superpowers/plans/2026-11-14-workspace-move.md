# Workspace Move Implementation Plan (P2, #926)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the repo into a bun workspace with today's app moved, unchanged, to `apps/blog`, so later plans can add `apps/sites` and `packages/*` (#924).

**Architecture:** The root becomes the workspace root: `package.json` with `workspaces: ["apps/*"]`, one `bun.lock`, repo-wide tooling (git hooks, commit linting, Danger, ESLint config, Playwright e2e, Docker), and root scripts that forward to the app with `bun run --filter blog <script>`. Everything the app owns (`src/`, `api/`, `server/`, `shared/`, `public/`, `config/`, `scripts/`, `.storybook/`, Vite/Vitest/Tailwind/TS configs, `vercel.json`) moves with `git mv`, keeping history. CI keeps calling root scripts, so workflow changes are limited to artifact paths. The Vercel project's Root Directory becomes `apps/blog`.

**Tech Stack:** bun 1.3.14 workspaces, Vite 5, Vitest 3, Playwright 1.65.0, Docker (`oven/bun:1.3.14-alpine`), Vercel.

**Spec:** `docs/superpowers/specs/2026-11-10-sites-design.md` (§3 constraints, §4 architecture) · Roadmap P2 · Issue #926 · Gate: the parity suite from #925.

## Global Constraints

- **No behaviour change to blog.brianlusina.com.** The parity suite (`e2e/`) must pass unchanged against this PR's Vercel preview. No `src/` code edits; only paths change.
- Use `git mv` for every moved file, so `git log --follow` keeps history.
- One lockfile, `bun.lock`, at the root (repo-policy enforces it). No dependency version changes in this PR.
- `packages/*` is not added to `workspaces` yet; P3 adds it with the first package.
- Root commands in `AGENTS.md` keep working from the repo root: `bun dev`, `bun run test`, `bun lint`, `bun run typecheck`, `bun run build`, `bun run e2e`.
- Stray files `fix_mocks.js` and `test-time.js` move with the app untouched (pre-existing; flagged, not deleted).

## Review Focus

1. **The Vercel Root Directory is a project-wide setting.** Changing it affects every branch's next deployment. `production` must not be pushed between the setting change and the promotion of this change. Expected: the PR body and #926 spell out the order.
2. **A path anchored to the repo root silently stops matching after the move:** `.gitignore`'s `/coverage`, ESLint `ignores`, `.dockerignore`'s `dist/`, lint-staged globs, CodeRabbit `path_instructions`. Expected: coverage, builds and Storybook output stay untracked; linting still skips generated files.
3. **Workspace binaries.** A tool declared only in the root `package.json` must still run from an app script (`eslint`, `stylelint`). Expected: `bun run lint` and `bun run lint:styles` from the root pass.
4. **Docker:** `bun install --frozen-lockfile` in the image needs every workspace's `package.json` copied before install. Expected: `docker build .` succeeds and the image answers `/healthz`.
5. **repo-policy tests** read both repo-level files (`.github/`, `Dockerfile`, `bun.lock`) and app files (`package.json` scripts, `vitest.config.mts`, `public/assets`). Expected: each assertion reads from the right root and still fails when its rule is broken.

## File Structure (after)

| Path | Owner | Notes |
|---|---|---|
| `package.json` | root | workspace root: `workspaces`, `packageManager`, repo-wide devDependencies, forwarding scripts |
| `bun.lock`, `.nvmrc`, `.gitignore`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.releaserc.json`, `commitlint.config.js`, `dangerfile.ts`, `codecov.yml`, `.coderabbit.yaml`, `.husky/`, `.lintstagedrc.js`, `eslint.config.js` | root | repo-wide tooling |
| `Dockerfile`, `.dockerignore`, `Makefile`, `.make/` | root | build the app from the workspace |
| `e2e/`, `playwright.config.ts` | root | e2e spans apps (later: `home`, `folio`) |
| `.github/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `LICENSE` | root | unchanged location |
| `apps/blog/**` | app | everything else, moved with `git mv` |

---

### Task 1: Move the app into `apps/blog` and make the root a workspace

**Files:**
- Move (git mv): `src/`, `api/`, `server/`, `shared/`, `public/`, `config/`, `scripts/`, `.storybook/`, `index.html`, `vite.config.mts`, `vitest.config.mts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `vercel.json`, `.env.sample`, `.stylelintrc`, `.stylelintignore`, `fix_mocks.js`, `test-time.js` → `apps/blog/`
- Create: `apps/blog/package.json` (name `blog`, `private: true`, the app's current scripts, dependencies and devDependencies minus the root-only tools below)
- Modify: `package.json` (root), `bun.lock`, `eslint.config.js`, `.lintstagedrc.js`, `.gitignore`, `apps/blog/scripts/repo-policy.spec.ts`

**Interfaces:**
- Root `package.json`:
  - `"name": "brianlusina-sites"`, `"private": true`, `"workspaces": ["apps/*"]`, the existing `packageManager`;
  - devDependencies moved from the app: `@commitlint/cli`, `@commitlint/config-conventional`, `husky`, `lint-staged`, `danger`, `imagemin-lint-staged`, `@playwright/test`, `@axe-core/playwright`;
  - scripts: `prepare` (`husky install`), `pre-commit` (`lint-staged`), `e2e`, `e2e:record`, `typecheck:e2e`, plus forwarding scripts `"<name>": "bun run --filter blog <name>"` for `dev`, `build`, `build:dev`, `preview`, `vercel:dev`, `check:bundle-size`, `lint`, `lint:fix`, `lint:styles`, `lint:styles:fix`, `typecheck`, `typecheck:api`, `typecheck:server`, `test`, `test:watch`, `test:coverage`, `storybook:dev`, `storybook:build`, `clean`, `depcheck`, `scan:licenses`, `format`.
- `apps/blog/package.json` no longer has `prepare`, `postinstall` (husky), `pre-commit`, `e2e*` or `typecheck:e2e`.
- `repo-policy.spec.ts` gets two roots: `repoRoot = path.resolve(__dirname, '..', '..', '..')` for `.github/`, `Dockerfile`, `bun.lock`, the root `package.json` (`packageManager`), `playwright.config.ts`, and the e2e workflows; `appRoot = path.resolve(__dirname, '..')` for the app's `package.json` scripts, `vitest.config.mts` and `public/assets`.

- [ ] **Step 1: Record the before state.** Run `bun run test`, `bun run typecheck`, `bun run typecheck:api`, `bun run typecheck:server`, `bun run typecheck:e2e`, `bun run lint`, `bun run lint:styles` and `bun run build`. Save the test count. Expected: all green, Vitest about 547 tests.
- [ ] **Step 2: Move the files with `git mv`** (list above). Write both `package.json` files. Run `bun install` to regenerate the root `bun.lock`. Expected: install succeeds; `apps/blog/node_modules` or the root `node_modules` holds the app's dependencies; `git status` shows renames (`R`), not delete-plus-add.
- [ ] **Step 3: Fix root-anchored patterns.**
  - `.gitignore`: `/coverage` → `coverage/`; `/node_modules` stays (plus the existing unanchored `node_modules/`).
  - `eslint.config.js` `ignores`: `["dist", "config/"]` → `["**/dist", "**/storybook-static", "apps/blog/config/"]`.
  - `.lintstagedrc.js`: `'src/**/*.css'` → `'apps/blog/src/**/*.css'`.
- [ ] **Step 4: Point repo-policy at the right roots** (interface above). Then break one repo-level rule (for example, add `package-lock.json` to the root) and one app-level rule (rename the app's `typecheck` script). Run `bun run test apps/blog/scripts/repo-policy.spec.ts`. Expected: both FAIL. Restore, rerun: PASS.
- [ ] **Step 5: Verify from the root.** Same commands as Step 1, plus `git status --ignored --short | grep -E "dist|coverage|storybook"` after a build and a coverage run. Expected: the same Vitest count as Step 1, all green; generated folders are listed as ignored (`!!`).
- [ ] **Step 6: Commit** (`refactor: move the journal app into apps/blog in a bun workspace`, body references #926).

### Task 2: Docker image and Make targets

**Files:** Modify `Dockerfile`, `.dockerignore`, `.make/common.mk`, `.make/docker.mk`, `apps/blog/scripts/repo-policy.spec.ts`

- [ ] **Step 1: Update the repo-policy Docker assertions first** to the new commands:
  - `^COPY package\.json bun\.lock ` (unchanged) and `^COPY apps/blog/package\.json apps/blog/`;
  - `^RUN bun run build$` (unchanged);
  - `^RUN bun apps/blog/server/build\.ts$`;
  - `COPY --from=builder /usr/src/app/apps/blog/dist ./dist`.

  Run them. Expected: FAIL against the old Dockerfile.
- [ ] **Step 2: Update the Dockerfile.**
  - Copy the root and app `package.json` files and `bun.lock`, install, `COPY . .`.
  - `RUN bun run build` (forwards to the app), then `RUN bun apps/blog/server/build.ts`.
  - The runtime stage copies `apps/blog/dist` → `./dist` and `apps/blog/dist-server/` → `./`. `CMD` stays `["bun", "server/index.js"]`, since the runtime layout is unchanged.

  `.dockerignore`: make `dist/`, `dist-server/`, `node_modules` match at any depth (`**/dist`, `**/dist-server`, `**/node_modules`). Run the policy tests. Expected: PASS.
- [ ] **Step 3: Build and smoke the image.** Run `docker build -t journal-workspace-check .` and `docker run -d -p 8080:8080 journal-workspace-check`. Then `curl -fsS localhost:8080/healthz` (expect `ok`) and `curl -fsS localhost:8080/ | grep '<div id="root">'`. Stop and remove the container. If the sandbox can't reach the package registry from inside Docker, record that and rely on CI's `dockerimage.yml` run.
- [ ] **Step 4: Make targets:** `.make/common.mk` copies `apps/blog/.env.sample` to `apps/blog/.env`; `.make/docker.mk` uses `apps/blog/.env.sample` → `.env.docker`. Check that `make -n` on the touched targets prints the new paths.
- [ ] **Step 5: Commit** (`build: build the Docker image from the bun workspace`).

### Task 3: CI paths, tooling paths and docs

**Files:** Modify `.github/workflows/build_app.yml`, `.github/workflows/tests.yml` (only if coverage paths are referenced), `.coderabbit.yaml`, `docs/ARCHITECTURE.md`, `AGENTS.md`, `README.md`, `CLAUDE.md` (only if it names moved paths)

- [ ] **Step 1: Workflows.** `build_app.yml` uploads `apps/blog/dist/` (and Storybook output from `apps/blog/storybook-static/` if uploaded). Check every workflow for remaining root-relative app paths (`grep -nE "\b(dist|src|api|server|public|coverage|storybook-static)/" .github/workflows/*.yml`). Expected: only `apps/blog/...` paths remain. Repo-policy workflow tests pass.
- [ ] **Step 2: `.coderabbit.yaml`** `path_instructions`: `src/…` → `apps/blog/src/…`.
- [ ] **Step 3: Docs.**
  - `docs/ARCHITECTURE.md`: "Source layout" describes the workspace (root vs `apps/blog`), and the other sections' paths gain the `apps/blog/` prefix where they name files.
  - `AGENTS.md` and `README.md`: commands unchanged (still run from the root); add the layout and `bun run --filter blog <script>`, and say that new dependencies go in `apps/blog/package.json` (`bun add --cwd apps/blog <pkg>`) unless they're repo-wide tooling.
  - Note the Vercel Root Directory.
- [ ] **Step 4: Full verification.** Run everything from Task 1 Step 1, plus `bun run check:bundle-size`, `bun run storybook:build` and the e2e `lib` project (`bunx playwright test --project=lib`). Expected: all green.
- [ ] **Step 5: Commit** (`docs: describe the workspace layout; ci: point artifact paths at apps/blog`). Push the branch.

### Task 4: Vercel switch and parity gate (needs Brian)

- [ ] **Step 1: Brian, in Vercel** (journal project → Settings → Build and Deployment): set **Root Directory** to `apps/blog` and keep "Include files outside the root directory" on.

  This is project-wide: from now on, every new deployment of any branch builds from `apps/blog`. Until this change reaches `production`, **don't push to `production` or `staging`**; the live sites keep serving their current deployments.
- [ ] **Step 2: Redeploy this branch's preview** (push or "Redeploy" in Vercel). Expected: the build log shows bun installing from the workspace root and building `apps/blog`; the `api/` functions are listed.
- [ ] **Step 3: Parity gate.** The E2E workflow runs on the preview's `deployment_status`. Expected: all suites green (`lib`, smoke, inventory, visual, a11y). Any visual diff means behaviour changed. Investigate; never re-record baselines to make it pass.
- [ ] **Step 4: After merge,** promote `develop` → `staging` → `production` promptly, then check the production E2E run and the 30-minute smoke.
