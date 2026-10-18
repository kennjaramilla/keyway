# Project memory

Status and hand-off notes. Update this file at the end of each work session.

## Status (2026-10-19, after QA round 1)

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

**QA round 1 (done, PRs #21 and #22):**

- Security: same-origin `?next` only (open redirect), security headers and no `x-powered-by`, the theme script is a plain literal and CodeQL ignores the generated MSW worker (0 open alerts), the Claude module is `server-only` and strips `<`/`>` from questions, malformed JSON returns 422, a corrupt stored db reseeds.
- Behaviour: switching building on a record page no longer reverts (the deep-link auto-switch runs once per request, and the switcher goes to the list page); the dashboard is labelled "All buildings" and hides the switcher; vendors are fetched only for the active building; message send cancels an in-flight poll; workflow steps patch only list fields into list caches; new timeline events record the previous status.
- UI: header fits at 375px, dashboard tables fit at 1280px and scroll in their card on phones, every time is shown in the building's time zone with its abbreviation, seed visit windows stay on whole hours, focus moves to the page h1 after client-side navigation, one `id="main"`, `EmptyState` heading levels, staff wording for "I don't know".
- Tests: handler tests split per handler file, Cypress axe runs in light and dark (serious/critical only), dead code removed (tabs, `api.patch`, unused exports).
- Docs: `PRODUCTION-READINESS.md`, `docs/application-flow.md`, `docs/code-tour.md`.

**Next:**

- Cut P1/P2 stories: resident cancel (2.8), manager vendor reassignment UI and its test (2.9, `can()` already allows it), reopen (2.10), dashboard date range (5.2), queue as stacked cards below `md` (6.4; for now the table scrolls inside its card with a minimum title width).
- Also open: unread badge in the nav, browsing the rules document (4.4).
- Hardening: a full Content-Security-Policy with nonces (needs the inline theme script and MSW worker handled), a signed server session, rate limiting on `/api/assistant`, code-splitting MSW out of the production bundle, bundle and Web Vitals budgets, error tracking.

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
