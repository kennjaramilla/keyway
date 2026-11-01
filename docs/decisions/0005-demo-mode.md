# 0005. Demo mode for sign-in

- Status: accepted
- Date: 2026-11-01

## Context

The sign-in page lists every seeded person, and choosing one signs you in as them. That is the right experience for a public demo: reviewers see all three roles in a minute without passwords. It is not production sign-in, and a reader of the code should be able to see exactly where the shortcut lives and how it is turned off.

## Decision

- **One flag.** `NEXT_PUBLIC_DEMO_MODE` is on unless set to `off` (`src/lib/demo-mode.ts`). The deployed demo, unit tests, Storybook and Cypress keep it on.
- **Off hides and refuses.** The sign-in page drops the people picker and shows "Continue with single sign-on", linking to `NEXT_PUBLIC_SSO_URL`, or says single sign-on isn't configured. The mock API also answers `GET /api/demo/people` and `POST /api/session` with 404, because hiding a button is not enforcement. Existing sessions keep working.
- **Demo on is labelled.** The picker carries a "Demo accounts · fake data" badge.

## Consequences

- Turning the flag off is a safe default for any environment that isn't the public demo, but it doesn't make Keyway production-ready on its own: a real identity provider (OIDC), a signed server session and the same switch in keyway-api (`/demo/*` and `POST /session`) are still needed. See `PRODUCTION-READINESS.md`.
- `NEXT_PUBLIC_*` values are inlined at build time, so changing the mode means rebuilding.
