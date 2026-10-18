---
name: new-feature
description: Build a Keyway feature end to end (schema, MSW handler with permission checks, API hooks, UI with all states, unit and Cypress tests) following the requests reference slice. Use when adding a page, endpoint or workflow step.
---

# New feature

Follow these steps in order. `src/features/requests/` and `src/mocks/handlers/requests.ts` are the reference implementation; copy their shape.

1. **Read the spec.** Find the user story in `docs/spec/user-stories.md`, the actions in the permission matrix in `docs/spec/product-spec.md`, and the fields and rules in `docs/spec/data-model.md`. Note the P0 acceptance criteria. They become your tests.
2. **Branch.** `git checkout -b feat/<feature> main`.
3. **Schema.** Extend `src/features/<feature>/schema.ts` with the entity and input schemas (Zod). Reuse the enums and labels that already exist.
4. **Permissions.** If the feature needs a new action, add it to `ACTIONS`, `ROLE_ACTIONS` and `inScope()` in `src/lib/auth/permissions.ts`, extend the matrix test, and map any new route in `src/lib/auth/routes.ts`.
5. **Handler.** Create or extend `src/mocks/handlers/<feature>.ts` and register it in `handlers/index.ts`:
   - `sessionUser(cookies)` → `unauthorized()` when null.
   - Load the resource, then `deny(user, "<view action>", resource)` first (404), then `deny(user, action, resource)` (403).
   - Parse the body with the schema → `validationError()` (422). Use `nextStatus()` → `conflict()` (409) for status changes.
   - Mutate only through `updateDb()`, and take ownership fields from the session.
   - Add a handler test next to `handlers.test.ts` for the allowed, 403, 404 and 422 cases.
6. **API + hooks.** Add query keys (include `buildingId` for building-scoped data) and fetchers to `api.ts`. Add hooks under `hooks/`. Mutations: invalidate affected keys, `toast()` on success and failure, and use optimistic updates with rollback where the story asks for them.
7. **UI.** Build with `src/components/ui`. Handle loading, empty and error/retry states. Use `PageHeader` for the page title. Gate controls with `can()`. Forms use React Hook Form + `zodResolver` + `FormField` so errors are announced. Check the page with the keyboard, in dark mode and at 375px.
8. **Tests.** Write unit tests with `renderInWorkspace` (real handlers; `server.use` for edge cases). Add a Cypress spec in `cypress/e2e/<feature>.cy.ts` using `cy.signInAs`, `cy.visitFresh` and `cy.checkPageA11y()`.
9. **Verify.** Run `npm run check`, then `npm run build && npm run e2e`. Then run the `qa` skill.
10. **Ship.** Make small lowercase commits (one line each, no attribution). Open the PR with `gh pr create` (summary, bullets, Testing:), wait for CI to go green, and merge with `gh pr merge --merge --delete-branch`.
