# Keyway user stories

Priority: **P0** = must work for tonight's demo · **P1** = nice to have · **P2** = roadmap.
🧪 **E2E-n** = one of the 5 P0 stories that becomes a Cypress flow (see the list at the end).
Seed names refer to `seed.json`. Action ids refer to `product-spec.md`.

P0 budget: about 2 engineers × 2 hours, on top of the scaffold. Engineer A takes requests and the workflow (stories 2.x). Engineer B takes sign-in, messages, the assistant and the dashboard. Shared: states and a11y.

---

## 1. Sign-in & roles

**1.1 Demo sign-in. P0**
As anyone, I pick a person from the seed to sign in as, so I can see their role.
- Given I'm signed out, when I open any workspace URL, then I'm redirected to `/sign-in`.
- Given I'm on `/sign-in`, then I see the people grouped by role (Resident, Coordinator, Property manager), each with their building or unit, and a note: "Demo only: no passwords. Data is fictional and stored in your browser."
- When I choose "Amara Okafor (Harbor View Lofts · 4B)", then I land on `/requests`, and the header shows my name, role and "Harbor View Lofts".
- Given I'm signed in, when I choose Sign out, then the session cookie is cleared and I'm back on `/sign-in`.

**1.2 Role-based navigation & route gating. P0**
- Given I'm a resident, the nav shows Requests, Messages and House rules. Given a coordinator, it shows Requests, Messages and House rules. Given the manager, it shows Dashboard, Requests and House rules.
- Given I'm a resident, when I visit `/dashboard`, then I see a "You don't have access to this page" view with a link home (and the proxy blocks it server-side too).

**1.3 Building switcher. P0**
As a coordinator or the manager, I switch the active building so that I only work in one building at a time.
- Given I'm Grace, when I open the switcher, then I see only Harbor View Lofts and Maple Court. Given I'm Theo, I see only The Linden, so the switcher shows the building name without a menu.
- When Grace picks Maple Court, then the header, page `<title>` ("Requests · Maple Court · Keyway") and all data on the page change to Maple Court, and a polite live region announces "Switched to Maple Court".
- Given I'm a resident, then there is no switcher, and my building is shown as static text.

**1.4 Reset demo data. P0**
- When I choose "Reset demo data" (user menu) and confirm, then the database is re-seeded, the query caches are cleared, and a toast says "Demo data reset".

**1.5 Manager reassigns a building's coordinator. P1**
- Given I'm the manager, when I move Maple Court from Grace to Theo, then Theo's switcher includes Maple Court, and Grace's no longer does after her next fetch.

---

## 2. Requests

**2.1 Resident submits a request. P0 🧪 E2E-1**
- Given I'm Amara, when I open "New request", then I see the fields Category, Urgency, Title, Description, Location in unit, Preferred times (1–3), Permission to enter (Yes/No) and Entry notes, plus an optional Photo field.
- When I submit with fields missing, then each invalid field shows an inline error linked by `aria-describedby`, and focus moves to the first invalid field.
- When I choose a photo, then a preview with "Remove" appears. The photo is not uploaded, and the helper text says so.
- When I pick Urgency = Emergency, then a banner says "If there's fire, smoke or a gas smell, leave and call 911 first", and preferred times become optional.
- When I submit a valid form, then I'm taken to the new request's detail page, where it has number `KW-1031`, status **New** and a "Request submitted" toast. It appears at the top of my list.

**2.2 Resident sees only their unit's requests. P0**
- Given I'm Amara (4B), when I open Requests, then I see exactly the 5 seeded requests for 4B plus any I created, and none from Diego (7A), even though he's in the same building.
- Each row shows the number, title, status badge (text label), urgency, created date and next visit (if any).

**2.3 Coordinator queue. P0**
- Given I'm Grace in Harbor View Lofts, then the queue lists only Harbor View requests, with columns for number, title, unit, category, urgency, status, age and vendor.
- When I filter by status (multi-select, default "Open" = all except Resolved), then the list and a result count update. The filter is kept in the URL (`?status=new,triaged`).
- When I sort by Urgency, Age or Last updated, then the order changes, and the column header has `aria-sort`.
- Overdue rows show an "Overdue" text badge.

**2.4 Request detail with timeline. P0**
- Given I can view a request, when I open it, then I see its details, the unit, preferred windows, permission to enter, entry notes, the vendor, the visit window, and a vertical timeline (oldest first) where each event shows its label, actor name and time.
- Given I'm a resident, then entry notes and status are read-only, and the only workflow action is cancelling a New request (2.8).

**2.5 Triage → assign → schedule → start → resolve. P0 🧪 E2E-3**
As a coordinator, I move a request through its workflow from the detail page.
- Given a **New** request, when I choose "Triage" (and optionally correct the urgency), then the status becomes **Triaged** and a `triaged` event is added.
- Given **Triaged**, when I choose "Assign vendor", then I see only vendors serving this building, with matching-trade vendors first. Picking one adds a `vendor_assigned` event.
- Given a vendor is assigned, when I choose "Schedule visit" and enter a valid window, then the status becomes **Scheduled**, the window is shown, and a `scheduled` event is added. Invalid windows (in the past, end before start, longer than 4h) show inline errors.
- Given **Scheduled**, "Mark in progress" changes the status to **In progress**. Given **In progress**, "Resolve" asks for a resolution note, sets **Resolved** and `resolvedAt`.
- Only the next valid action is enabled. An invalid transition from the API (409) shows a toast and refreshes the request.
- Each action shows a toast. Reverting "Mark in progress" via Undo is a P1 nicety.

**2.6 Reschedule. P1** Given **Scheduled**, when I change the window, then the status stays the same and a `rescheduled` event is added.
**2.7 Queue: urgency/category filters and text search. P1**
**2.8 Resident cancels a New request. P1** After confirming (optional reason), the status becomes **Cancelled**, the request leaves open counts, and a `cancelled` event is added.
**2.9 Manager reassigns vendor. P1**
**2.10 Reopen within 7 days. P2** Given a request resolved in the last 7 days, the resident or coordinator can reopen it with a reason: it goes back to **In progress** and a `reopened` event is added. After 7 days the button is gone and the API returns 409.
**2.11 Real photo upload. P2** · **2.12 Vendor portal / SMS updates. P2**

---

## 3. Messages

**3.1 Thread per request. P0 🧪 E2E-4**
- Given I'm on a request I can view, then a "Messages" panel shows the thread with the resident and coordinator, oldest first, with author and time on each message, or the empty state "No messages yet. Ask a question or add details." if there are none.
- When I type a message and press Enter (or Send), then it appears immediately as "Sending…" and becomes sent after the API responds. The input clears and keeps focus.
- Given I'm Grace in Harbor View Lofts, when I open KW-1017, then I see Diego's messages. When I send a reply, then Diego sees it when he opens the same request.

**3.2 Rollback on failure. P0**
- Given the next send fails (demo toggle `?fail=messages`), when I send, then the optimistic message changes to "Not sent" with a **Retry** action, my text is restored to the input, and an error toast appears. Retry sends it again.

**3.3 Messages inbox. P1**
- `/messages` lists the threads in scope (resident: own unit; coordinator: active building), sorted by last message, each with an unread count badge (with text, e.g. "2 unread").
- Seeded: Grace has unread messages in KW-1017 (1) and KW-1029 (2). Amara has 1 unread in KW-1023.

**3.4 Polling. P1** While a thread is open and the tab is visible, poll every 5s (TanStack `refetchInterval`, paused when hidden). New messages are announced in a polite live region.
**3.5 Mark as read. P1** Opening a thread calls `/read`, and the badges update.
**3.6 Attachments, typing indicators. P2**

---

## 4. House-rules assistant

**4.1 Ask with citations. P0 🧪 E2E-5**
- Given I'm on House rules, then the page title includes the active building, and I see "Answers come only from {Building}'s house rules", an "Answer mode: Retrieval" badge, and 3 example questions as buttons.
- When I ask "How many dogs or cats can I keep?" as Amara, then the answer contains [1], and below it a numbered source list shows "Harbor View Lofts House Rules §3.1 Pets" with the excerpt. Each [n] marker links to its source (keyboard reachable).
- When Grace switches to Maple Court and asks the same question, then the answer and the citation change to `mpc-pets` (§2.1).

**4.2 "I don't know". P0** (part of E2E-5)
- When I ask "What is the Wi-Fi password?", then the reply is exactly "I don't know. Please message your coordinator.", with no citations and a "Message your coordinator" button (it opens my latest open request's thread, or New request if I have none).
- Questions shorter than 3 characters are rejected inline.

**4.3 Claude mode. P1** Given `ANTHROPIC_API_KEY` is set, the badge reads "Answer mode: Claude". Any error falls back to retrieval, and the badge then says Retrieval.
**4.4 Browse the rules document. P1** · **4.5 Multi-turn follow-ups. P2**

---

## 5. Dashboard (manager)

**5.1 Portfolio dashboard. P0**
- Given I'm Helena, when I open `/dashboard`, then I see 4 KPI tiles (Open requests, Resolved this week, On-time rate, Overdue) with week-on-week trends, a 7-day volume chart, on-time performance, building health, vendor status, and 4 panels: Open by building, Avg time to resolve by building, Overdue by urgency, and Coordinator workload.
- Each chart has a visible "Show table" toggle that renders the same data as a `<table>` with a caption and headers. Charts have a text summary (`aria-label` / `<figcaption>`), and series are distinguished by pattern or label as well as colour.
- With seed data: Open is Harbor 7, Maple 7, Linden 6. Overdue is high 2, normal 1, low 1. Workload is Grace 14, Theo 6.
- Clicking a building bar or table row opens the requests list for that building (P1).

**5.2 Date range filter. P1** · **5.3 Coordinator dashboard (own buildings). P2** · **5.4 CSV export. P2**

---

## 6. Cross-cutting

**6.1 Tenant isolation at the API. P0 🧪 E2E-2**
- Given I'm Diego (Harbor 7A), when I open the URL of KW-1023 (Amara's 4B request), then I see "Request not found", and the API returned 404.
- Given I'm Theo (The Linden only), when I open the URL of any Harbor View request, then I see "Request not found" (404). `GET /api/requests?buildingId=bld_harbor` also returns 404.
- Given I'm Grace in Harbor View Lofts, when I switch to Maple Court, then the queue contains only Maple Court requests (11 seeded), the rules assistant cites only `mpc-*` passages, and the vendor picker lists only vendors serving Maple Court.
- Given I'm a resident, when I POST a request with another `unitId`, then the server ignores it and uses mine.

**6.2 Loading, empty and error states. P0**
- Every data view (queue, my requests, detail, thread, assistant answer, dashboard) shows a skeleton that matches the layout while loading, with `aria-busy` set.
- Empty states have plain copy and a next step, e.g. "No open requests in Maple Court" with "Show resolved", or for a resident "You haven't reported anything yet" with "New request".
- Errors show "Something went wrong loading requests" with a **Retry** button that refetches. Unit tests cover all three states via MSW overrides.

**6.3 Accessibility baseline. P0**
- All pages pass `cypress-axe` with no serious or critical violations.
- Focus is visible everywhere, and there is a skip-to-content link. Dialogs trap focus, close on Esc, and return focus to the trigger. Form errors are announced. Status and urgency are never conveyed by colour alone. AA contrast in light and dark themes.

**6.4 Responsive. P1** Usable at 375px: the queue becomes cards, the nav becomes a menu.
**6.5 Dark mode toggle. P1** (tokens exist in P0; toggle can follow system).
**6.6 Audit log export, real auth/SSO, notifications. P2**

---

## Cypress e2e flows (P0)

| Flow | Story | Signed in as | Gist |
|---|---|---|---|
| **E2E-1** submit request | 2.1 | resident (Amara) | validation errors → fill → photo preview → submit → detail shows New + toast → in list |
| **E2E-2** tenant isolation | 6.1 | resident (Diego), coordinator (Theo, Grace) | other-unit URL → not found; other-building URL → not found; switch building → queue only Maple Court |
| **E2E-3** coordinator workflow | 2.5 | coordinator (Grace) | KW-1030 New → Triage → Assign Tidewater → Schedule → In progress → Resolve; timeline has 6 events |
| **E2E-4** messaging | 3.1 (+3.2) | coordinator then resident | Grace replies on KW-1017 → sign in as Diego → reply visible; with `?fail=messages`, the reply shows Not sent + Retry |
| **E2E-5** assistant | 4.1 + 4.2 | coordinator (Grace) | Harbor pets question cites §3.1 → switch to Maple Court → cites §2.1 → Wi-Fi question returns "I don't know" |

`cy.signInAs('resident' | 'coordinator' | 'manager')` defaults to Amara, Grace and Helena. Add an optional second argument with a userId, for Diego and Theo.
