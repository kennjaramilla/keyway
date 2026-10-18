# Project memory

Status and hand-off notes. Update this file at the end of each work session.

## Status (2026-10-19)

**Foundation done:**

- Scaffold, strict TS, ESLint + Prettier, and CI (quality → unit + e2e + storybook, plus CodeQL and disabled Sonar/Black Duck jobs). Dependabot is intentionally off so every commit is authored by a person; dependency updates are done manually through PRs.
- Design tokens (light/dark) and the component library in `src/components/ui` with stories and tests.
- Demo sign-in (seeded people grouped by role), session cookie, `proxy.ts` gating, `permissions.ts`, and the workspace shell (nav, building switcher, user menu with theme, reset and sign out, plus a no-access page).
- MSW mock API: session, buildings, demo reset, and requests list/detail with isolation. The full spec seed is loaded and re-timed to now.
- Docs: CLAUDE.md, TESTING.md, ADRs 0001-0003, and the Claude skills `new-feature` and `qa`.
- Deployed: https://kenn-keyway.vercel.app (Vercel project `keyway`, git-connected, production branch `main`).

**Phase 2, engineer B (done):**

- Messages (stories 3.1-3.5): `/messages` inbox (unread counts, last-message preview) and `/messages/[requestId]`. Optimistic send via an outbox reducer (`features/messages/outbox.ts`): "Sending…", then sent, or "Not sent" + Retry, a toast and the text restored. `?fail=messages` arms a one-shot 500 (`mocks/demo-failures.ts`). 5s polling (paused when hidden), mark-as-read, polite live region. Reusable `MessageThread` and `MessageThreadLink` for the request detail page.
- House rules (4.1-4.3): `features/house-rules/retrieval.ts` (BM25 per house-rules.md, plus one extra guard: the top passage must match at least half the question's terms, so "pay my rent online" doesn't match the laundry rule's "pay"). `/api/assistant` is a real Next route (no MSW handler): it checks the session cookie and `rules:ask`, answers with retrieval, and uses Claude (`claude-sonnet-5-5`, 8s timeout, citations validated) only when `ANTHROPIC_API_KEY` is set, falling back to retrieval on any error. In Vitest, `src/test/assistant-route.ts` routes the endpoint to the handler.
- E2E: `messages.cy.ts` (E2E-4), `house-rules.cy.ts` (E2E-5), `isolation.cy.ts` (E2E-2, API 404s and building switch across requests, threads and rules).

**Phase 2, engineer A (done):**

- Requests (2.1-2.7): resident submit form (E2E-1; photo preview drawn on a canvas, never uploaded), queue with status/urgency/category filters, search and sort kept in the URL (staff default to open requests), overdue badges, and a detail page with timeline, embedded `MessageThread` and only the next valid workflow steps (E2E-3), optimistic with rollback toasts. A coordinator deep link into another covered building switches to it. Endpoints: `POST /requests`, `POST /requests/:id/{triage|assign|schedule|start|resolve}`, `GET /vendors`. Schedule rules (building-local hours) live in `requests/schema.ts`, shared by the form and the API. E2E-2 now also checks the "Request not found" page.
- Manager dashboard (5.1): `GET /api/dashboard` computed by `dashboard/metrics.ts`; KPI tiles and four bar charts, each with a "Show table" toggle.

**Next:**

- P1 left: unread badge in the nav, browsing the rules document (4.4), resident cancel (2.8), manager vendor reassignment UI (2.9, `can()` already allows it), mobile card layout for the queue (6.4), date range on the dashboard (5.2).
- Both: PRODUCTION-READINESS.md, docs/application-flow.md and docs/code-tour.md.

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
- Cache Components keeps visited pages mounted but hidden, so Cypress `findByLabelText` can match a hidden page's field; prefer `findByRole` (it skips hidden elements).
- `msw/browser` is aliased to a stub for server bundles in `next.config.ts`.
- Storybook's `fn()` spies don't type-check against Vitest 5 mocks, so stories don't put `fn()` in `args` that tests override.
