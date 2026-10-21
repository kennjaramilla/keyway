# 0004. A real API alongside the mock

- Status: accepted
- Date: 2026-10-21

## Context

ADR 0001 made MSW the API everywhere and promised that "moving to a real API means implementing the same endpoints, Zod contracts and status codes, then turning mocking off". That API now exists: [keyway-api](https://github.com/kennjaramilla/keyway-api), NestJS with MongoDB. The deployed demo, unit tests and Storybook should keep using the mock (fast, no infrastructure, per-viewer data), and the two backends must not drift.

## Decision

- **One switch.** `KEYWAY_API_URL` (for example `http://localhost:4000`) turns MSW off (`NEXT_PUBLIC_API_MOCKING=off` via `next.config.ts`) and adds a Next _fallback_ rewrite of `/api/*` to the API. It's a fallback so Next's own `/api/assistant` route still wins. The browser stays same-origin, so the session cookie needs no CORS and the API can make it httpOnly.
- **One contract.** keyway-api's `npm run sync:domain` copies this repo's Zod schemas, `permissions.ts`, status machine, dashboard metrics and `seed.json`. Rules change here first and are synced.
- **One test suite.** The API's tests are ported from the MSW handler tests. CI's "E2E (Cypress on the real API)" job runs this repo's Cypress suite against keyway-api and MongoDB. `cy.visitFresh` re-seeds through `POST /api/demo/reset`; the three tests that use the mock-only `?fail=` and `?reset` toggles run with `mockOnlyIt`.

## Consequences

- Both backends are exercised on every PR, so a contract change that only one side implements fails CI.
- The real-API job checks out keyway-api's `main`. A breaking contract change needs the API change merged first (or both at once), which is the honest order for a real backend too.
- In real-API mode every viewer shares one database, unlike the per-browser mock.
