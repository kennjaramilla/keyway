# Inheriting a fast, AI-built front end: how I'd make it production-ready

A front end built quickly with an AI assistant usually works on the happy path and has no safety net: no tests, logic copied between screens, inconsistent components, and permission checks that only hide buttons. Rewriting it stops delivery, so I wouldn't. I'd make it safe to change first, then improve it one slice at a time while features keep shipping. Keyway is a small example of where that ends up; each phase below points to the files that show it.

## 1. Protect what works

Before changing anything, write down the flows that would hurt most if they broke (sign-in per role, the main workflow, anything touching permissions or other customers' data) and cover them with a few end-to-end smoke tests against a production build. Then make CI run them on every pull request, so the rest of the work can't silently break them.

- Critical flows and stories: `docs/spec/user-stories.md` (E2E-1 to E2E-5)
- Smoke and flow specs: `cypress/e2e/smoke.cy.ts`, `auth.cy.ts`, `isolation.cy.ts`
- CI gates: `.github/workflows/ci.yml` (quality, unit, e2e on `next build && next start`, Storybook build)

## 2. Give it a structure

Group code by feature, not by file type, so one change touches one folder. Put every network call behind one typed client that validates responses, so contract drift fails loudly in one place. Separate server state (cached, refetched) from UI state (small and local).

- Feature folders: `src/features/<feature>/{schema.ts,api.ts,hooks/,components/}`, with `src/features/requests/` as the reference slice
- Typed API layer: `src/lib/api-client.ts` (fetch + Zod parsing + problem-details errors)
- One schema per entity, shared by forms, parsing and the mock API: `src/features/requests/schema.ts`
- Server vs UI state: TanStack Query hooks in `features/*/hooks/`, a tiny Zustand store in `src/stores/` (ADR `docs/decisions/0002-tanstack-query-zustand.md`)
- One permission function used by routes, UI and API: `src/lib/auth/permissions.ts`

## 3. Build a component system

Extract design tokens (colour, spacing, type) into CSS variables with light and dark values, build a small set of accessible primitives on Radix, and document each in Storybook. Migrate screens gradually: new work uses the library, and old screens move over when they're touched.

- Tokens: `src/app/globals.css`
- Primitives with story and test side by side: `src/components/ui/<component>/`
- Storybook with the a11y addon: `.storybook/`; stories reused as test fixtures via `composeStories`
- ADR: `docs/decisions/0003-radix-tailwind-component-library.md`

## 4. Raise the quality gates

Add unit and component tests where the risk is (permissions, state machines, validation, data-view states), accessibility checks on every page, coverage thresholds on logic folders, and static security analysis. Add performance budgets once the basics are green.

- Unit and component tests with the real mock API: `src/**/*.test.ts(x)`, `src/test/`
- Accessibility in e2e, both themes: `cypress/support/commands.ts` (`cy.checkPageA11y`)
- Coverage thresholds: `vitest.config.mts` (lines 80, functions 80, branches 75 on `src/lib` and `src/features`)
- CodeQL: `.github/workflows/codeql.yml`, `.github/codeql/codeql-config.yml`
- Security headers: `next.config.ts`
- Strategy and conventions: `TESTING.md`
- Next: a bundle-size and Lighthouse budget in CI (the MSW worker and its handlers are the biggest avoidable cost today)

## 5. Write conventions down for humans and AI

The same tools that produced the first version will keep writing code, so give them the rules. A short CLAUDE.md, reusable skills for "add a feature" and "review a change", hooks that format and lint every edit, and a PR template turn the conventions into defaults instead of review comments.

- `CLAUDE.md` (stack, where things live, how to add a feature, definition of done)
- `.claude/skills/new-feature/SKILL.md`, `.claude/skills/qa/SKILL.md`
- `.claude/settings.json` + `.claude/hooks/format.mjs` (format and lint after each edit)
- `.github/pull_request_template.md`, ADRs in `docs/decisions/`

## 6. Observe it in production (next steps)

Tests catch what we thought of; production shows the rest. Next I'd add:

- Error tracking (for example Sentry) behind `reportError` (`src/lib/report-error.ts`), which the route error boundaries (`src/app/(workspace)/error.tsx`, `error.tsx`, `global-error.tsx`) already call; then the API client's `ApiError` and release tags from CI
- Web Vitals (LCP, INP, CLS) reported from `useReportWebVitals`, with alerts on regressions
- Basic product analytics on the critical flows from phase 1, so we know they're used the way we think
- A full Content-Security-Policy with nonces, once the mock worker is out of the production bundle
