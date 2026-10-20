# Code tour (15 minutes)

A guided path through Keyway for a reviewer. Start with the live demo (https://kenn-keyway.vercel.app): sign in as Grace (coordinator), open a request, then switch to Maple Court. Then read these files in order.

## Reading order

1. **`CLAUDE.md`**: the conventions in one page: stack, where things live, how to add a feature, definition of done. It's written for people and for AI assistants, so both follow the same rules.
2. **`src/lib/auth/permissions.ts`**: the single source of truth for who can do what. `roleCan()` for routes, `can()` for UI, `authorize()`/`deny()` for the API. Pure and dependency-free so the proxy, components and handlers share it; `permissions.test.ts` covers the full matrix.
3. **`src/proxy.ts`**: optimistic route gating from the session cookie. It only decides what to render; real enforcement happens again at the API.
4. **`src/features/requests/schema.ts`**: one Zod schema per entity, shared by forms, response parsing and the mock API, plus the status state machine (`TRANSITIONS`, `nextStatus()`) and the visit-window rules. One definition means the form, the client and the "server" can't disagree.
5. **`src/lib/api-client.ts`**: typed fetch that parses every response with a schema and turns problem details into `ApiError`. Contract drift fails here, not deep inside a component.
6. **`src/mocks/handlers/requests.ts`**: what a real backend would do: session lookup, scope check (404 before 403), Zod validation (422), state machine (409), ownership from the session. `requests.test.ts` next to it is the API contract.
7. **`src/features/requests/hooks/useRequest.ts`**: TanStack Query patterns: building in every scoped key, optimistic workflow steps that patch only list fields, rollback with a toast, a 409 refetches the truth.
8. **`src/features/requests/components/RequestDetailView.tsx`** and **`WorkflowActions.tsx`**: a full data view with loading, error, not-found and populated states; controls shown with `can()`; a deep link into another covered building switches to it once.
9. **`src/features/messages/hooks/useConversation.ts`** and **`outbox.ts`**: optimistic send through a small reducer ("Sending…", sent, or "Not sent" + Retry), polling that pauses when hidden, and cancelling an in-flight poll before caching a sent message.
10. **`src/app/api/assistant/route.ts`** with **`src/features/house-rules/retrieval.ts`** and **`claude.ts`**: deterministic retrieval with citations, an optional Claude mode restricted to the provided passages, and a fallback on any error.

Then skim the test setup: `src/test/render.tsx` (`renderInWorkspace`), `cypress/support/commands.ts` (`cy.signInAs`, `cy.checkPageA11y` in both themes) and `.github/workflows/ci.yml`.

## Trade-offs I'd defend

- **MSW in the browser is a contract, not a security boundary.** The handlers enforce permissions so the UI is built and tested against realistic 401/403/404/409/422 responses, but anything in the browser can be bypassed. With a real backend the same rules move server-side and the handlers become contract tests.
- **The demo session cookie is unsigned.** It's `role.userId.buildingId`, readable by the proxy, the mock API and Cypress. Tampering gains nothing because the mock API re-checks the user and building against the db, but a real app needs a signed, httpOnly session from the server.
- **MSW ships in the production bundle.** That's what makes the hosted demo work without a backend, at the cost of bundle size and a short wait before first render (the worker must start before any request). With a backend it would be dropped from production builds (`NEXT_PUBLIC_API_MOCKING=off` already skips starting it).
- **Cache-key rules.** Every building-scoped query key includes the `buildingId`, and a building switch invalidates everything except the session. That costs some refetching, and buys a guarantee that one building's data never appears under another's header.
- **Deep links switch building once.** Opening a request from another covered building switches to it so the header never lies; switching away afterwards leaves the record page for the new building's list instead of fighting the user.
- **One file per workflow dialog, but only once it paid off.** `WorkflowActions.tsx` decides which steps `TRANSITIONS` and `can()` allow; the dialogs live in `components/workflow/` around one shared `ActionDialog`. They started in one file and were split when cancel and reopen made it six; splitting at four would mostly have added indirection.
- **The assistant's rate limit is in memory.** 10 questions per person per minute (`src/lib/rate-limit.ts`) stops a runaway client, but each server instance counts on its own. A shared store (Redis) is the production version.

## Next steps

- Build the cut stories: manager vendor reassignment UI and test (2.9), manager reassigns a building's coordinator (1.5), dashboard date range (5.2).
- A full Content-Security-Policy with nonces, a signed server session, and a shared store for the assistant's rate limit.
- Code-split MSW out of the production bundle once a real API exists; add bundle and Web Vitals budgets.
- Plug error tracking into `reportError` (the route error boundaries already call it) and report Web Vitals (see `PRODUCTION-READINESS.md`, phase 6).
