# Keyway

A maintenance portal demo for a property-management company with three apartment buildings. Residents submit and track maintenance requests, coordinators triage and schedule them across the buildings they cover, and a property manager sees the whole portfolio. All people, buildings and data are fictional.

**Live demo:** https://kenn-keyway.vercel.app (pick a person on the sign-in page; no passwords)

## What it shows

- Multi-tenant roles with tenant isolation enforced at the API, not only hidden in the UI
- A request workflow driven by one status table: triage to resolved, plus cancel and reopen within 7 days
- A house-rules assistant that cites its sources, links into the full rules document, and is rate limited
- A design-token component library (Radix + Tailwind) documented in Storybook with accessibility checks
- A testing setup built from scratch: Vitest + Testing Library, MSW, Cypress + axe, and CI

## Start here

- [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md): how I'd make a fast, AI-built front end production-ready, with pointers into this repo
- [docs/code-tour.md](docs/code-tour.md): a 15-minute reading order and the trade-offs behind it
- [docs/application-flow.md](docs/application-flow.md): roles, data flow, the request state machine and the assistant

## Run it

Requires Node 22 and npm.

```bash
npm install
npm run dev            # http://localhost:3000
```

There's no backend. A Mock Service Worker API with a seeded in-browser database answers `/api/*` (see `docs/decisions/0001-msw-mock-api.md`). Use **Reset demo data** in the user menu, or add `?reset` to any URL, to start over.

## Test it

```bash
npm run check          # lint, typecheck, unit tests, production build
npm run test:coverage  # unit tests with coverage
npm run build && npm run e2e   # Cypress against the production build (port 3100)
npm run storybook      # component library on :6006
npm run format         # Prettier
```

See [TESTING.md](TESTING.md) for the strategy and conventions.

## Project docs

- [CLAUDE.md](CLAUDE.md): conventions, how to add a feature, definition of done
- [docs/spec/](docs/spec/): product spec, user stories, data model, seed, house rules
- [docs/decisions/](docs/decisions/): architecture decision records
- [docs/memory.md](docs/memory.md): project status and how to resume

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI, TanStack Query, Zustand, React Hook Form + Zod, MSW, Vitest, Cypress, Storybook. Deployed on Vercel.
