# AGENTS Instructions

## Project Overview

LJournal is a personal blog and journal website. It displays blog posts sourced from a headless CMS (Contentful) via GraphQL and REST APIs. The site includes article feeds, author pages, tag-based filtering, search, and a newsletter signup.

## Technology Stack

- **Framework**: React 18 (SPA with Vite)
- **Language**: TypeScript
- **Bundler**: Vite 5 with SWC
- **Routing**: React Router DOM v6 (lazy-loaded routes)
- **UI & Styling**: shadcn/ui (Radix primitives), Tailwind CSS, Lucide React
- **Data Fetching**: Apollo Client (GraphQL), TanStack Query v5 (REST)
- **Monitoring**: Sentry
- **Analytics**: Firebase
- **Forms**: React Hook Form + Zod

## General Guidance

- When adding new components, ensure that they have associated tests and are placed in the `src/components` directory.
- Each newly added component should have an associated storybook component with it to enable viewing the component in isolation and additionally testing it for things such accessibility. For more information about Storybook, check this [storybook documentation](https://storybook.js.org/llms.txt).
- Each new component should have it's own directory, for example a button component `Button` should be under the `src/components/button` folder and associated tests should be colocated with the component, so, for example `src/components/button/Button.tsx` will be the component and the test is `src/components/button/Button.test.tsx` and the story will be `src/components/button/Button.stories.tsx`.
- Each new page should have it's own directory, for example an Articles page `ArticlesPage` should be under the `src/pages/Article` folder and associated tests should be colocated with the page, so, for example `src/pages/Article/ArticlesPage.tsx` will be the page and the test is `src/pages/Article/ArticlesPage.test.tsx`
- Each new utility, library or integration will follow the same pattern as described for components and pages.
- Every newly added feature must have an associated test. If tests already exist, validate that changes made pass the existing tests or extend the tests to validate the new changes. Similar case applies to bug fixes and refactoring.

## Environment Setup

- Ensure [bun](https://bun.sh) is installed and used as the package manager to handle dependencies and to run commands.
- Use [bun](https://bun.sh) as the package manager to handle dependencies and to run commands.

## Commands

- **Run dev server**: `bun dev`
- **Run tests**: `bun test`
- **Run linting**: `bun lint`
- **Build**: `bun run build`
- **Preview production build**: `bun run preview`
- **Storybook**: `bun run storybook`

## Building and Testing

- Format and lint the code before committing with `bun lint`
- Run tests with `bun test`
- Build the project with `bun run build`

## Commits and PRs

Write commit messages focused on user impact, not implementation details

- **Good**: `fix: user login not displaying proper error message`
- **Good**: `feat(ui): fix grid view not refreshing after user update`
- **Bad**: `setup hooks`

Alternative is to use [Chris Beams](https://chris.beams.io/git-commit) style for commit messages

- Every pull request should answer:
  - What changed? n
  - Why?
  - Breaking changes?
- Comments should be complete sentences and end with a period.

## Review Checklist

- All tests from `bun test` must succeed.
- Add new tests for any new feature or bug fix.
- Update documentation for user-facing changes.

## Additional context

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
