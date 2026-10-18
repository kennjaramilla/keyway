# 0001. Mock Service Worker is the API, in every environment

- Status: accepted
- Date: 2026-10-19

## Context

Keyway is a front-end demo with no backend. It still has to behave like a real multi-tenant product: requests need permission checks, tenant isolation, validation errors and latency. The same behaviour has to show up in unit tests, Storybook, Cypress and the deployed demo, and the code should not change when a real API arrives.

## Decision

- The app talks HTTP to `/api/*` through `src/lib/api-client.ts`. MSW handlers in `src/mocks/handlers/` answer those requests: `setupWorker` in the browser and `setupServer` in Vitest.
- The handlers are the server. They read the session cookie, call `can()`/`authorize()` from `src/lib/auth/permissions.ts`, return problem details (401/403/404/409/422), and set ownership fields themselves.
- Data lives in an in-memory db (`src/mocks/db.ts`) seeded from `src/mocks/seed.json` and re-timed to the current time. In the browser it is persisted to `localStorage` so the demo survives a reload. "Reset demo data", `?reset` and `resetDb()` re-seed it.
- **MSW is on in production builds.** There is no backend, so the deployed demo and the Cypress runs (which test `next build && next start`) need it. `MockApiProvider` starts the worker and holds rendering until it is ready. Setting `NEXT_PUBLIC_API_MOCKING=off` disables it, and `NEXT_PUBLIC_API_BASE_URL` points the client at a real API.
- The worker uses `onUnhandledFrame: "bypass"`, so routes without a handler (for example the `/api/assistant` Next route handler) reach Next.js.
- The session cookie (`keyway_session` = `role.userId.activeBuildingId`) is written by the mock session handlers, standing in for a server `Set-Cookie`. `proxy.ts` reads it for optimistic route gating, and every handler re-validates it against the db.

## Consequences

- Unit, Storybook, e2e and demo runs share one network contract and one set of rules. Isolation is tested at the API level, not only by hiding UI.
- Every page waits a moment for the worker on first load, and server-rendered HTML for data views is only a loading shell. That's acceptable for a demo.
- Each browser has its own data. Viewers can't see each other's changes, which is what a demo wants.
- Moving to a real API means implementing the same endpoints, Zod contracts and status codes, then turning mocking off. The UI does not change.
