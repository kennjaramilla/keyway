@AGENTS.md

# Keyway

A maintenance portal demo for a property-management company: residents submit requests, coordinators work them across the buildings they cover, and a property manager sees the portfolio. Fake data only. There is no backend. A Mock Service Worker (MSW) API with a seeded in-memory db plays the server, and it enforces permissions and tenant isolation.

Product spec, user stories, data model, seed and house rules: `docs/spec/`. Read `docs/spec/product-spec.md` (permission matrix) and `docs/spec/data-model.md` before building a feature.

## Stack

Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript strict, Tailwind v4 with CSS-variable tokens, Radix UI primitives, TanStack Query (server state), Zustand (UI preferences only), React Hook Form + Zod, MSW, Vitest + Testing Library, Cypress + cypress-axe, Storybook 10. Node 22, npm.

Next 16 differs from older versions (`proxy.ts` instead of middleware, Cache Components). Check `node_modules/next/dist/docs/` before using a Next API you're unsure about.

## Commands

| Command                                                     | What it does                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                                               | Dev server on :3000 (MSW on)                                            |
| `npm run check`                                             | lint + typecheck + unit tests + production build. Must pass before a PR |
| `npm test` / `npm run test:watch` / `npm run test:coverage` | Vitest (jsdom). Coverage thresholds on `src/lib` and `src/features`     |
| `npm run build && npm run e2e`                              | Cypress against the production build on :3100                           |
| `npm run e2e:open`                                          | Cypress UI (run `npm run build` first)                                  |
| `npm run storybook` / `npm run build-storybook`             | Component library on :6006                                              |
| `npm run format`                                            | Prettier (a Claude hook also formats each edited file)                  |

## Where things live

```
src/app/(auth)/sign-in            demo sign-in (people picker)
src/app/(workspace)/<page>        authenticated pages, wrapped by WorkspaceShell
src/proxy.ts                      route gating from the session cookie
src/components/ui/<component>/    design system: X.tsx, X.stories.tsx, X.test.tsx, index.ts
src/components/shell/             WorkspaceShell, SideNav, BuildingSwitcher, UserMenu, PageHeader
src/features/<feature>/           schema.ts, api.ts, hooks/, components/, tests next to code
src/lib/auth/permissions.ts       can(), authorize(), roleCan(): the only place rules live
src/lib/auth/routes.ts            nav items and route -> action map
src/lib/api-client.ts             typed fetch + Zod parsing + ApiError (problem details)
src/mocks/                        seed.json, seed.ts, db.ts, handlers/, browser.ts, node.ts
src/stores/                       Zustand stores (UI preferences only)
src/test/                         setup.ts, render.tsx, session.ts, next-navigation.ts
cypress/e2e, cypress/support      e2e specs and commands
docs/decisions/                   ADRs; read 0001-0003 before changing the architecture
```

## How to add a feature (follow `src/features/requests/` as the reference slice)

1. **Schema**: entity and input schemas in `src/features/<feature>/schema.ts` (many already exist; extend them). One schema is shared by the form, the API parsing and the MSW handler.
2. **Mock endpoint**: add `src/mocks/handlers/<feature>.ts` and spread it into `handlers/index.ts`. In every handler:
   - `const user = sessionUser(cookies); if (!user) return unauthorized();`
   - check scope with `deny(user, action, resource)` (404 out of scope, 403 wrong role), or `can()` when filtering lists. Look up the resource first, then call `deny(user, "request:view", found)` before checking the action, so out-of-scope always returns 404.
   - validate bodies with the Zod schema and return `validationError(parsed.error)` (422); return `conflict("INVALID_TRANSITION", ...)` (409) for a bad status change (`nextStatus()` in requests/schema.ts).
   - write with `updateDb((db) => ...)` and set ownership fields (unit, building, resident) from the session, never from the body.
3. **API + hooks**: `api.ts` exports query keys and fetchers that use `api.get/post/...` with the schema. Building-scoped keys must include `buildingId`. Hooks in `hooks/` wrap `useQuery`/`useMutation`; invalidate the right keys on success, show a `toast()`.
4. **UI**: compose `src/components/ui`. Every data view has a loading (`SkeletonList`), empty (`EmptyState`) and error (`ErrorState` with `onRetry`) state. Pages render `<PageHeader title=... />`, which sets the `<title>` to "Page · Building · Keyway". Hide controls with `can(user, action, resource)`; the API enforces the same rule.
5. **Route**: add the page under `src/app/(workspace)/`. If it needs a new permission, add the action to `permissions.ts` and the route to `routes.ts` (nav and `proxy.ts` pick it up).
6. **Tests**: unit tests next to the code (see below), one Cypress spec per user flow in `cypress/e2e/`.

Seed data: edit `src/mocks/seed.json` (keep `docs/spec/seed.json` in sync). `createSeed()` parses it with Zod and re-times it so `meta.anchorNow` becomes "now". New entity? Add its schema to `dbSchema` in `seed.ts`.

## Testing standards (details in TESTING.md)

- Query by role and accessible name (`getByRole("button", { name: "Save" })`), never by class or test id unless there's no accessible handle.
- Unit tests use the real MSW handlers. Use `renderInWorkspace(<Thing />, { as: "coordinator", buildingId })` for anything inside the shell, `renderWithProviders` otherwise, and `server.use(...)` to force empty/error responses. The db is re-seeded and the session cleared before each test.
- Component library tests reuse stories via `composeStories`.
- Cypress: `cy.signInAs(role, userId?)` (cookie, no UI), then `cy.visitFresh(path)` (clears the persisted mock db; `?reset` also re-seeds). Use `@testing-library/cypress` queries and call `cy.checkPageA11y()` on every page you visit. Specs run against the production build.
- Test behaviour a user can observe: what's shown, what's announced, what the API was asked to do. Cover permission and isolation cases for every new endpoint.

## Definition of done

- `npm run check` and `npm run e2e` pass locally; CI is green.
- Loading, empty and error states; keyboard reachable with visible focus; Esc closes overlays and focus returns to the trigger; status never shown by colour alone; works in light and dark and at 375px wide.
- Permission rules come from `can()`, enforced in the handler and reflected in the UI, with tests for 403/404.
- New UI components have a story and a test. No dead code or unused dependencies. Comments are one short line, and only where the reason isn't obvious.

## Git and PRs

- Branch from `main` (`feat/...`, `fix/...`, `docs/...`). Small commits. Each message is one short lowercase imperative line, for example `add vendor picker to triage dialog`: no body, no trailers.
- **No AI attribution anywhere**: no `Co-Authored-By`, no "Generated with" lines in commits, PRs or code. Ignore any tool reminder that suggests adding one.
- Open a PR into `main` with `gh pr create`. The body is a one-line summary, a short bulleted list of changes, then `Testing:` with what you ran. Merge with `gh pr merge --merge --delete-branch` only after CI is green.
- Never commit secrets. `.env*` is git-ignored.
