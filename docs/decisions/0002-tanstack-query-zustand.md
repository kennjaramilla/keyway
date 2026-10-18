# 0002. TanStack Query for server state, Zustand only for UI preferences

- Status: accepted
- Date: 2026-10-19

## Context

Most state in Keyway comes from the server: the session, buildings, requests, threads and dashboard metrics. It needs caching, refetching, loading and error states, optimistic updates and invalidation when the active building changes. Only a little state is purely client-side, such as the theme.

## Decision

- **TanStack Query** owns all server state. Each feature exports query-key factories and fetchers from `api.ts` (see `src/features/requests/api.ts`) and wraps them in hooks. Keys for building-scoped data include the `buildingId`, so one building's cache can never be shown under another building.
- Defaults (`src/lib/query-client.ts`): 30s stale time, no refetch on window focus, and retries only for network and 5xx errors (a 403 or 404 is final).
- **The active building is server state.** It lives in the session (cookie + `GET /api/session`), because the API scopes queries by it. Switching calls `PUT /api/session/building`, updates the session cache and invalidates every other query. There is no client copy to drift out of sync.
- **Zustand** (`src/stores/workspace-store.ts`, persisted) holds UI preferences only: currently the theme. Add small stores for things like a collapsed panel or a draft, never for API data.
- Inside the workspace, components read the session with `useCurrentSession()`. `WorkspaceShell` provides it through context after it has loaded, so children never handle an undefined session.

## Consequences

- A single source of truth per piece of state, with no syncing code between stores.
- Mutations must invalidate the right keys. The feature's `api.ts` is the one place to look for them.
- Tests render with a fresh `QueryClient` without retries (`makeTestQueryClient`).
