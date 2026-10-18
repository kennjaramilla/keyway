# Project memory

Status and hand-off notes. Update this file at the end of each work session.

## Status (2026-10-19)

**Foundation done:**

- Scaffold, strict TS, ESLint + Prettier, and CI (quality → unit + e2e + storybook, plus CodeQL, Dependabot and disabled Sonar/Black Duck jobs).
- Design tokens (light/dark) and the component library in `src/components/ui` with stories and tests.
- Demo sign-in (seeded people grouped by role), session cookie, `proxy.ts` gating, `permissions.ts`, and the workspace shell (nav, building switcher, user menu with theme, reset and sign out, plus a no-access page).
- MSW mock API: session, buildings, demo reset, and requests list/detail with isolation. The full spec seed is loaded and re-timed to now.
- Example slice: read-only requests list (`src/features/requests`).
- Docs: CLAUDE.md, TESTING.md, ADRs 0001-0003, and the Claude skills `new-feature` and `qa`.
- Deployed: https://kenn-keyway.vercel.app (Vercel project `keyway`, git-connected, production branch `main`).

**Next (phase 2, see `docs/spec/user-stories.md`):**

- Engineer A, requests: submit form (E2E-1), detail + timeline, coordinator workflow (triage/assign/schedule/start/resolve, E2E-3), queue filters and sort. Add the schedule-window schema (building-local hours) to `requests/schema.ts`.
- Engineer B: messages (optimistic send + rollback, `?fail=messages`, E2E-4), house-rules assistant (`retrieval.ts`, `/api/assistant`, E2E-5), manager dashboard (charts + table alternative). Replace the placeholder pages in `src/app/(workspace)/{messages,house-rules,dashboard}`.
- Both: tenant isolation E2E-2 (detail page 404 view), and PRODUCTION-READINESS.md, docs/application-flow.md and docs/code-tour.md.

## How to resume

1. `cd ~/dev/personal/keyway && git checkout main && git pull && npm install`
2. Read `CLAUDE.md`, then `docs/spec/user-stories.md` for the next story.
3. `npm run dev`, sign in as a role, and look around. Use `npm run check` before every PR.
4. Use the `new-feature` skill to build and the `qa` skill to review.

## Gotchas

- Port 3000 may already be taken on this machine by another local server, so e2e uses port 3100 (`npm run start:e2e`).
- Next 16 with `cacheComponents`: keep request-time reads (cookies) out of server components. Workspace pages are client components fed by TanStack Query.
- Don't add a default `title` to root metadata: it would override the per-page "Page · Building · Keyway" `<title>` that `PageHeader` renders.
- The theme script sits in `<body>`, because Cypress injects into `<head>` and a head script causes a hydration mismatch.
- `msw/browser` is aliased to a stub for server bundles in `next.config.ts`.
- Storybook's `fn()` spies don't type-check against Vitest 5 mocks, so stories don't put `fn()` in `args` that tests override.
