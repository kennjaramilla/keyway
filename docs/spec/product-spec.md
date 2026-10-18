# Keyway product spec

Keyway is a maintenance portal for a property-management company that runs several apartment buildings. This spec covers the demo build: three fictional buildings, demo sign-in, and a mock API (MSW). It contains no real people, companies or addresses.

## Problem

Residents report maintenance problems by phone, email and notes under the office door. Coordinators re-type them, chase vendors, and answer the same house-rules questions again and again. Managers can't see what's open, what's late, or who is overloaded. Each building has its own rules, so a wrong answer about pets or laundry causes real problems.

Keyway gives every request a clear, auditable lifecycle. It keeps the conversation attached to the request, answers rules questions from that building's own documents (with citations), and shows the whole portfolio on one dashboard. Each building's data stays isolated from the others.

## Personas

| Persona | Example (seed) | Goals | Pain today |
|---|---|---|---|
| **Resident** | Amara Okafor, Harbor View Lofts 4B | Report a problem in under a minute; know when someone is coming; get a quick, correct answer about the rules; talk to a person when needed | No idea if a request was received; repeats details; conflicting rule answers |
| **Coordinator** | Grace Adeyemi (Harbor View Lofts + Maple Court); Theo Marchetti (The Linden) | See the right building's queue, triage fast, get the right vendor booked, keep residents informed, never mix up buildings | Juggles spreadsheets per building; easy to message the wrong resident or quote the wrong building's rule |
| **Property Manager** | Helena Brightwater (all buildings) | See open load, speed and overdue work across the portfolio; rebalance coordinators and vendors | Has to ask each coordinator for numbers; no consistent definition of "late" |

## Scope for the demo

**In (P0 = tonight):**
- Demo sign-in with a role/person picker (no password, labelled as a demo), sign out, and route gating by role.
- Building switcher for coordinators (only buildings they cover) and the manager (all buildings). The current building is shown in the header and page title.
- Resident: submit a request (category, urgency, description, location, preferred windows, permission to enter, optional photo with client-side preview only), see a list of their unit's requests, and see request detail with a status timeline.
- Coordinator: a queue for the active building (status filter, sort), and request detail with triage, vendor assignment, scheduling a visit window, start, and resolve.
- Messages: one thread per request between resident and coordinator, with optimistic send that rolls back on failure.
- House-rules assistant: answers only from the active building's passages, with numbered citations, and says "I don't know" when nothing matches.
- Manager dashboard: open requests by building, average time to resolve, overdue by urgency, and coordinator workload. Each chart has a table alternative.
- Isolation enforced in the mock API (404 outside your scope), not only in the UI.
- Loading, empty and error states (with retry) on every data view; keyboard and WCAG AA basics; a "Reset demo data" action.

**Later (P1/P2, see user-stories.md):** message polling and unread badges (P1), filter by urgency/category and search (P1), resident cancel (P1), reassigning a building's coordinator and reassigning vendors as the manager (P1), reopen (P2), real photo upload, notifications (email/SMS), vendor portal, real auth/SSO, recurring/preventive maintenance, i18n.

**Out:** payments or rent, leases and accounting, vendor invoicing, real backend, and any medical, staffing or productivity-tracking concepts.

## Glossary

- **Active building**: the building the coordinator or manager is currently working in. It is stored in the session and changed only through `building:switch`.
- **Scope**: the set of records a user may see. A resident's scope is their unit, a coordinator's is the buildings they cover (narrowed to the active building in the UI and in list endpoints), and the manager's is all buildings.
- **Overdue**: a request is overdue when it is not resolved and `now > createdAt + slaHours[urgency]`. The SLA targets are emergency 24h, high 72h, normal 168h (7d) and low 336h (14d).

## Role / permission matrix

`can(subject, action, resource?)` in `src/lib/auth/permissions.ts` is the single source of truth. Routes, UI and MSW handlers all call it. The `subject` is the session user `{ id, role, unitId, buildingIds, activeBuildingId }`. A bare role is not enough, because the scope checks need the user's unit and buildings.

Legend: ✅ allowed · ❌ denied · *scope* = the condition that must also hold for the resource.

| Action id | Resident | Coordinator | Manager | Priority |
|---|---|---|---|---|
| `session:sign-in` / `session:sign-out` | ✅ | ✅ | ✅ | P0 |
| `demo:reset` | ✅ | ✅ | ✅ | P0 |
| `building:switch` | ❌ (fixed to own building) | ✅ *target ∈ buildingIds* | ✅ *any building* | P0 |
| `request:create` | ✅ *unitId = own unit* (server sets unit, building, resident) | ❌ | ❌ | P0 |
| `request:list` | ✅ *own unit only* | ✅ *activeBuildingId ∈ buildingIds* | ✅ *active building, or all* | P0 |
| `request:view` (detail + timeline) | ✅ *request.unitId = own unit* | ✅ *request.buildingId ∈ buildingIds* | ✅ | P0 |
| `request:triage` (New→Triaged, may correct category/urgency) | ❌ | ✅ *in scope* | ❌ | P0 |
| `request:assign` (set/replace vendor) | ❌ | ✅ *in scope; vendor serves building* | ✅ (P1) | P0 |
| `request:schedule` (set visit window; Triaged→Scheduled, or reschedule) | ❌ | ✅ *in scope; vendor assigned* | ❌ | P0 |
| `request:start` (Scheduled→In progress) | ❌ | ✅ *in scope* | ❌ | P0 |
| `request:resolve` (In progress→Resolved) | ❌ | ✅ *in scope* | ❌ | P0 |
| `request:cancel` (New only) | ✅ *own unit, own request* | ❌ | ❌ | P1 |
| `request:reopen` (Resolved→In progress, ≤7 days) | ✅ *own unit* | ✅ *in scope* | ❌ | P2 |
| `building:assign-coordinator` | ❌ | ❌ | ✅ | P1 |
| `vendor:list` | ❌ | ✅ *vendors serving active building* | ✅ | P0 |
| `thread:view` (read messages) | ✅ *thread.residentId = self* | ✅ *thread.buildingId ∈ buildingIds* | ❌ | P0 |
| `message:send` | ✅ *own thread* | ✅ *in scope* | ❌ | P0 |
| `rules:ask` | ✅ *own building* | ✅ *active building* | ✅ *active building* | P0 |
| `rules:view` (browse passages) | ✅ *own building* | ✅ *active building* | ✅ *active building* | P1 |
| `dashboard:view` | ❌ | ❌ (P2: own buildings) | ✅ | P0 |

### Tenant-isolation rules (enforced in MSW handlers, mirrored in the UI)

1. **Resident = unit.** Every request, thread and message query is filtered by `unitId = session.unitId`. A resident in Harbor View 7A never sees anything from 4B, even in the same building. The rules assistant always uses the resident's own building, and there is no switcher.
2. **Coordinator = active building.** List endpoints require a `buildingId` that must equal the session's `activeBuildingId`, and that building must be in `buildingIds`. Switching buildings changes the queue, the threads, the vendor list and the rules corpus together, and clears the cached queries for the old building.
3. **Manager = portfolio.** The manager can read requests in every building and see aggregates on the dashboard, but does not read or send resident messages.
4. **Out of scope returns 404, not 403.** If a resource exists but is outside the caller's scope (another unit, an uncovered building), the API returns `404 Not found`, so callers can't learn that it exists. The UI shows a "Request not found" page.
5. **Wrong role returns 403.** If the resource is in scope but the action is not allowed for the role (for example, a resident calling triage), the API returns `403 Forbidden`, and the UI hides the control.
6. **The server sets ownership.** On `request:create` the API sets `unitId`, `buildingId`, `residentId` and `coordinatorId` from the session and ignores any values sent by the client.
7. **Covered but not active.** If a coordinator opens a deep link to a request in another building they cover, the API returns it (it is in scope), and the UI offers a one-click "Switch to Maple Court" banner instead of silently showing it under the wrong building (P1; in P0 the UI may simply switch the active building).
