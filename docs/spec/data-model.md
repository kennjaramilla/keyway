# Keyway data model

Each entity has one Zod schema (`src/features/<feature>/schema.ts`). Forms, API-response parsing and MSW handlers all share it. All ids are opaque strings with a prefix. All timestamps are ISO-8601 UTC strings (`...Z`), and the UI formats them in the viewer's locale. `seed.json` matches this document exactly. Seed timestamps are relative to `meta.anchorNow` (2026-10-19 10:00 New York time). `seed.ts` shifts every ISO timestamp by `Date.now() - anchorNow`, and every `preferredWindows.date` by the same number of whole days, on load and reset, so the dashboard numbers stay realistic on any day.

## Enums

```ts
Role        = 'resident' | 'coordinator' | 'manager'
Category    = 'plumbing' | 'electrical' | 'heating_cooling' | 'appliance' | 'doors_locks' | 'pest' | 'general'
Trade       = Category                       // vendors use the same keys
Urgency     = 'emergency' | 'high' | 'normal' | 'low'
Status      = 'new' | 'triaged' | 'scheduled' | 'in_progress' | 'resolved'
Location    = 'kitchen' | 'bathroom' | 'bedroom' | 'living_room' | 'entry' | 'laundry' | 'balcony' | 'other'
TimeSlot    = 'morning' | 'afternoon' | 'evening'   // 08–12, 12–17, 17–20 building-local
TimelineEventType = 'created' | 'triaged' | 'vendor_assigned' | 'scheduled' | 'rescheduled'
                  | 'started' | 'resolved' | 'note' | 'cancelled' | 'reopened'   // last two P1/P2
```

Display labels: Plumbing · Electrical · Heating & cooling · Appliance · Doors & locks · Pests · General repair. Urgency: Emergency · High · Normal · Low. Status: New · Triaged · Scheduled · In progress · Resolved. Status and urgency badges always show a text label (and may add an icon) and never rely on colour alone.

## Entities

### Building
| field | type | notes |
|---|---|---|
| id | string | `bld_*` |
| slug | string | URL-safe, e.g. `harbor-view-lofts` |
| name | string | |
| address | string | fictional |
| yearBuilt | number | |
| unitCount | number | |
| timezone | string | IANA; all seed buildings use `America/New_York` |
| coordinatorIds | string[] | coordinators covering this building |
| description | string | one line shown in the switcher |

### Unit
`id` (`unit_*`), `buildingId`, `label` (e.g. "4B"), `floor: number`, `bedrooms: number`.

### User
| field | type | notes |
|---|---|---|
| id | string | `usr_*` |
| role | Role | |
| name | string | |
| email | string | `@example.com` |
| unitId | string \| null | required for residents, null otherwise |
| buildingIds | string[] | resident: [own building]; coordinator: covered buildings; manager: all |

Session (cookie, not in seed): `{ userId, role, activeBuildingId }`. For residents, `activeBuildingId` is always their own building.

### Vendor
`id` (`ven_*`), `name`, `trade: Trade`, `phone`, `buildingIds: string[]` (service area).

### Request
| field | type | notes |
|---|---|---|
| id | string | `req_*` |
| number | string | human ref `KW-1001`, server-assigned, monotonically increasing |
| buildingId, unitId, residentId | string | server-set from session on create |
| coordinatorId | string | server-set to the building's first coordinator |
| vendorId | string \| null | |
| category | Category | |
| urgency | Urgency | |
| status | Status | |
| title | string | |
| description | string | |
| location | Location | where in the unit |
| preferredWindows | `{ date: 'YYYY-MM-DD', slot: TimeSlot }[]` | |
| permissionToEnter | boolean | |
| entryNotes | string \| null | pets, access instructions |
| visitWindow | `{ start: ISO, end: ISO }` \| null | set when scheduled |
| createdAt, updatedAt | ISO | |
| resolvedAt | ISO \| null | set on resolve |
| timeline | TimelineEvent[] | append-only, oldest first |

Photo: the form keeps the file only in component state (`URL.createObjectURL` preview, revoked on unmount/remove). It is **never sent** to the API and is not part of the schema.

Derived (not stored): `isOverdue`, `dueAt = createdAt + slaHours[urgency]`, `ageHours`.

### TimelineEvent
`id` (`evt_*`), `type: TimelineEventType`, `at: ISO`, `actorId: string`, `fromStatus?: Status`, `toStatus?: Status`, `note?: string`, `meta?: { vendorId?: string; visitWindow?: {start,end} }`.

### Thread / Message
Thread: `id` (`thr_*`), `requestId` (unique, one thread per request), `buildingId`, `residentId`, `coordinatorId`, `createdAt`, `lastMessageAt`, `lastReadAt: Record<userId, ISO | null>`.
A thread is created lazily when the first message is sent on a request.

Message: `id` (`msg_*`), `threadId`, `authorId`, `body`, `createdAt`. Client-only for optimistic sends: `clientId` (temporary id) and `pending`/`failed` flags, which are never persisted.

Unread count for user U on a thread = messages with `authorId ≠ U` and `createdAt > lastReadAt[U]` (or all of them if null). Opening a thread sets `lastReadAt[U] = now`.

### RuleDocument / RulePassage
RuleDocument: `id` (`doc_*`), `buildingId`, `title`, `effectiveDate: 'YYYY-MM-DD'`, `version: number`.
RulePassage: `id` (stable, `<buildingPrefix>-<topic>`, e.g. `hvl-pets`), `documentId`, `buildingId`, `section` (e.g. "3.1"), `title`, `text`.

### AssistantAnswer (API response, not stored)
```ts
{ mode: 'retrieval' | 'claude',
  answer: string,                 // contains [1], [2] markers, or the fallback sentence
  citations: { n: number; passageId: string; section: string; title: string; excerpt: string }[],
  answered: boolean }            // false => "I don't know. Please message your coordinator."
```

## Status state machine

```
new ──triage──▶ triaged ──schedule──▶ scheduled ──start──▶ in_progress ──resolve──▶ resolved
 │                 ▲  assign (no status change)   │ reschedule (stays scheduled)       │
 └─cancel (P1)     └──────── unschedule (P1) ─────┘                                    └─reopen (P2) ▶ in_progress
```

| From → To | Action | Who | Preconditions | Timeline event |
|---|---|---|---|---|
| (none) → new | `request:create` | Resident (own unit) | valid form | `created` |
| new → triaged | `request:triage` | Coordinator (in scope) | may change category/urgency; optional note | `triaged` |
| triaged/scheduled → same | `request:assign` | Coordinator (P1: Manager) | vendor serves the building | `vendor_assigned` (meta.vendorId) |
| triaged → scheduled | `request:schedule` | Coordinator | `vendorId` set; valid window | `scheduled` (meta.visitWindow) |
| scheduled → scheduled | `request:schedule` | Coordinator | new valid window | `rescheduled` |
| scheduled → in_progress | `request:start` | Coordinator | none | `started` |
| in_progress → resolved | `request:resolve` | Coordinator | resolution note required | `resolved` (note); sets `resolvedAt` |
| new → (cancelled) | `request:cancel` | Resident | P1; status stays out of scope for P0 | `cancelled` |
| resolved → in_progress | `request:reopen` | Resident/Coordinator | P2; ≤7 days after resolvedAt | `reopened` |

Any other transition returns `409 Conflict` from the API, with `{ code: 'INVALID_TRANSITION' }`. The UI shows only the next valid action button(s). Export the machine as data (`TRANSITIONS: Record<Status, {action, to}[]>`) so the UI, handlers and tests share one table.

## Validation rules (Zod)

**RequestCreate** (resident form)
- `category`: required enum.
- `urgency`: required enum. Default `normal`. If `emergency` is chosen, the form shows a banner: "If there's fire, smoke or a gas smell, leave and call 911 first."
- `title`: required, trimmed, 5–80 chars.
- `description`: required, trimmed, 10–1000 chars, with a counter shown.
- `location`: required enum.
- `preferredWindows`: 1–3 items, unique (date+slot), each `date` between today and today+14 (building-local), no past dates. **Optional (0 allowed) when urgency = emergency.**
- `permissionToEnter`: required boolean (radio Yes/No, no default).
- `entryNotes`: optional, ≤200 chars. Helper text: "Don't include door codes."
- `photo` (client only): optional, one file, `image/jpeg|png|webp`, ≤10 MB. Errors are shown inline and the file is never uploaded.

**Triage**: `category?`, `urgency?`, `note?` ≤500.
**Assign**: `vendorId` required, and it must be a vendor whose `buildingIds` include the request's building. The picker lists matching-trade vendors first, then `general`.
**Schedule**: `start` and `end` required. `start` must be in the future, `end > start`, the window must be 1–4 hours long, on the same local day, within the next 30 days, and inside 08:00–20:00 building-local unless urgency = emergency. Requires `vendorId`.
**Resolve**: `resolutionNote` required, trimmed, 5–500 chars.
**Message**: `body` trimmed, 1–2000 chars, not whitespace-only. Enter sends and Shift+Enter adds a newline.
**Rules question**: trimmed, 3–300 chars.
**Sign-in**: `userId` must exist in the seed.

## Mock API (MSW) sketch

All endpoints read the session cookie and call `can()`. They return `401` with no session, `403` for the wrong role, `404` for out-of-scope resources, `409` for an invalid transition, and `422` with Zod issues for validation errors.

```
POST /api/session            {userId}            GET /api/session      DELETE /api/session
PUT  /api/session/building   {buildingId}
GET  /api/buildings                              (in-scope buildings only)
GET  /api/requests?buildingId&status&sort        POST /api/requests
GET  /api/requests/:id
POST /api/requests/:id/{triage|assign|schedule|start|resolve}
GET  /api/vendors?buildingId
GET  /api/threads?buildingId                     GET /api/threads/:requestId/messages
POST /api/threads/:requestId/messages            POST /api/threads/:requestId/read
POST /api/assistant          {buildingId, question}   (passthrough to Next route when real mode is on)
GET  /api/dashboard                              POST /api/demo/reset
```

The demo error toggle: `?fail=messages` (or a dev-only setting) makes the next `POST .../messages` return 500, to demo the rollback.

## Dashboard metric definitions
- **Open by building**: count where `status ≠ resolved`, grouped by building, split by status.
- **Avg time to resolve**: mean of `resolvedAt − createdAt` (hours, displayed as "2.1 days") for requests resolved in the last 30 days, per building and overall.
- **Overdue by urgency**: count of open requests where `now > createdAt + slaHours[urgency]`, grouped by urgency.
- **Coordinator workload**: open requests per `coordinatorId`, split by status.
- **Week on week**: requests created (and resolved) in the last 7 days vs the 7 days before; the 7-day series counts per building-local day.
- **On-time performance**: over open requests plus those resolved in the last 30 days. Met = resolved by `dueAt`, or open and less than halfway to it; at risk = open and past halfway; breached = resolved late or overdue. On-time rate = (met + at risk) / total.
- **Building health**: open, overdue and on-time rate per building.
- **Vendor status**: per vendor from its open requests: on site (any in progress), scheduled, assigned, or available.

With the seed as of anchor time, these come out as follows: open Harbor 7 / Maple 7 / Linden 6; overdue high 2 (KW-1014, KW-1017), normal 1 (KW-1010), low 1 (KW-1006); workload Grace 14, Theo 6; on time 25 met / 1 at risk / 4 breached (87%).
