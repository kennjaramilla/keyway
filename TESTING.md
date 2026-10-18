# Testing Keyway

A first draft of the testing strategy: what we use, why, how tests are organised, and where they run.

## Tools and why

| Layer              | Tool                                                                                     | Why                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and component | **Vitest** + **React Testing Library** + **jest-dom** (jsdom)                            | Fast, ESM-native, and shares its Vite transform with Storybook. RTL makes us test what the user sees and does, not implementation details.                             |
| Network            | **MSW** (`msw/node` in Vitest)                                                           | Tests use the same handlers as the app, so permissions, isolation and validation are exercised for real. Override per test with `server.use(...)`.                     |
| Component library  | **Storybook 10** + **portable stories** (`composeStories`) + **a11y addon**              | Each story is documentation, a visual check and a test fixture. The a11y panel runs axe on every story in both themes.                                                 |
| End to end         | **Cypress** + **@testing-library/cypress** + **cypress-axe** + **start-server-and-test** | Real browser, against the production build (`next build && next start`), with the MSW worker on. Role-based queries keep specs readable and tie them to accessibility. |
| Coverage           | **@vitest/coverage-v8**                                                                  | Thresholds on `src/lib/**` and `src/features/**`: lines 80, functions 80, branches 75.                                                                                 |
| Static             | ESLint (Next + Storybook rules), Prettier, `tsc` strict, CodeQL                          | Catches whole classes of bugs before tests run.                                                                                                                        |

## Structure

```
src/**/X.test.ts(x)              next to the code it tests
src/components/ui/<c>/X.test.tsx  component tests reusing X.stories.tsx
src/mocks/handlers/*.test.ts      API contract, permissions and tenant isolation
src/test/setup.ts                 jest-dom, MSW server, db reset, jsdom shims, next/navigation mock
src/test/render.tsx               renderWithProviders, renderInWorkspace
src/test/session.ts               signInAs(role | userId, buildingId?) for unit tests
cypress/e2e/*.cy.ts               one spec per user flow
cypress/support/commands.ts       cy.signInAs, cy.visitFresh, cy.checkPageA11y
```

## Conventions

- **Query like a user**: `getByRole(role, { name })` first, then `getByLabelText` and `getByText`. Avoid test ids and CSS selectors.
- **Interact like a user**: `const { user } = renderWithProviders(...)`, then `await user.click/type/keyboard`. Use `findBy*` for anything async.
- **Real network, controlled data**: the db is re-seeded before every test (`resetDb()`), the session cookie is cleared after each one, and unhandled requests fail the test. Sign in with `signInAs()` or `renderInWorkspace(ui, { as, buildingId })`.
- **Force edge cases at the network**: `server.use(http.get("*/api/requests", () => HttpResponse.json([])))` for empty, or a 500 response with `{ once: true }` for error and retry.
- **Every data view** is tested in its loading, empty, error (with retry) and populated states.
- **Every endpoint** is tested for allowed, wrong role (403), out of scope (404) and invalid input (422), plus 409 for status changes.
- **Cypress**: `cy.signInAs("coordinator")` (or `cy.signInAs("resident", "usr_res_diego")`), then `cy.visitFresh(path)` so each test starts from the seed, then assert, then `cy.checkPageA11y()`. Retries: 2 in run mode. Screenshots on failure.
- Don't assert on styling except where it carries meaning (for example `aria-sort` or `aria-invalid`).

## What to test first (priority order)

1. **Permissions and tenant isolation**: `permissions.test.ts` (the full role matrix) and the handler tests. A leak here is the worst bug the product can have.
2. **Critical flows end to end**: sign-in per role, route gating, building switching, and then the five P0 flows in `docs/spec/user-stories.md` (E2E-1 to E2E-5) as features land.
3. **State machine and validation**: the `TRANSITIONS` table and the form schemas, at the boundaries.
4. **Data view states**: loading, empty, error and retry for each list and detail view.
5. **Component library behaviour**: keyboard, focus return, ARIA wiring.

## Where tests run

| When                  | What                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------- |
| On save (Claude Code) | Prettier + ESLint fix via the PostToolUse hook                                            |
| Locally               | `npm run check` (lint, typecheck, unit, build); `npm run build && npm run e2e`            |
| CI `quality`          | lint, format check, typecheck (with `next typegen`)                                       |
| CI `unit`             | `vitest run --coverage`, coverage report uploaded as an artifact                          |
| CI `e2e`              | Cypress on the production build (Chrome); screenshots uploaded on failure                 |
| CI `storybook`        | `storybook build`                                                                         |
| CI `codeql`           | security and quality queries on every PR and weekly                                       |
| Disabled, ready       | SonarQube and Black Duck jobs in `ci.yml` (see the comments there for how to enable them) |

## Next steps

- Run Storybook stories as tests in CI with `@storybook/addon-vitest` (browser mode) to include interaction and a11y checks.
- Visual regression (Chromatic or Playwright screenshots) for the component library.
- Contract tests to check that a real API matches the Zod schemas once a backend exists.
