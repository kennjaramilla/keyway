# Keyway 5-minute demo script

Before you start: open the production URL, choose **Reset demo data**, and use a light theme with the window at about 1280px. Keep a second tab ready for the "other user" view. The times on the left are cumulative.

**0:00 Framing (20s)**
"Keyway is a maintenance portal for a property company with three buildings. It has three roles, strict per-building isolation, a request workflow, messaging, a rules assistant that cites its sources, and a portfolio dashboard. It runs on Next.js, TypeScript, Radix + Tailwind, TanStack Query, RHF + Zod and MSW, with tests in Vitest, Storybook and Cypress."

**0:20 Sign-in and roles (30s)**
1. Show `/sign-in`: people grouped by role, with the "Demo only" note.
2. Sign in as **Amara Okafor, Harbor View Lofts · 4B**. Point out the header, which shows her name, role and building with no switcher. The nav has Requests, Messages and House rules.

**0:50 Resident submits a request (50s)**
3. Open **New request** and press Submit while the form is empty. Inline errors appear and focus jumps to the first one (keyboard-first).
4. Fill it in: Electrical · Normal · "Bathroom exhaust fan rattles", a short description, Location = Bathroom, two preferred times, Permission = Yes. Attach a photo to show the client-side preview, and say it is never uploaded.
5. Submit. The detail page shows **KW-1031 · New**, a toast, and the timeline with one event.
6. Go back to the list. It shows only 4B's requests, and Diego's 7A requests are not there.

**1:40 Isolation (40s)**
7. Copy the URL of KW-1031, sign out, and sign in as **Diego (7A, same building)**. Paste the URL. You get **Request not found**. "That's a 404 from the API itself, not hidden UI."
8. Sign in as **Theo (The Linden only)**. His switcher shows only The Linden, and a Harbor View URL also returns not found.

**2:20 Coordinator workflow (60s)**
9. Sign in as **Grace Adeyemi**. The queue shows Harbor View Lofts. Filter Status = New and sort by Urgency. The top row is **KW-1030, Water heater leaking (Emergency)**. Point out the Overdue badges on KW-1014 and KW-1017.
10. Open KW-1030. **Triage**, then **Assign vendor**. The picker lists Tidewater Plumbing first, and only vendors serving this building. **Schedule visit** for today plus 1h, 2 hours long. Show one validation error by setting the end before the start, then fix it. Then **Mark in progress** and **Resolve** with a note. The timeline grows with each step and each action shows a toast.
11. Switch the building to **Maple Court**. The whole page changes: the title, the queue (Maple Court only), and the announcement "Switched to Maple Court".

**3:20 Messaging (40s)**
12. Switch back to Harbor View and open **KW-1017, Shower valve dripping**. The thread shows Diego's "Great, thank you!". Reply "Plumber confirmed the cartridge is replaced. Can you check tonight?". The message appears instantly (optimistic).
13. Add `?fail=messages` and send another message. It shows **Not sent · Retry** and the text goes back into the input. Click Retry and it succeeds. "Optimistic update with rollback, driven by one MSW toggle."

**4:00 House-rules assistant (40s)**
14. Open **House rules** (still Harbor View). Ask "How many dogs or cats can I keep?". The answer cites **[1] §3.1 Pets**: up to two, no size limit.
15. Switch to **Maple Court** and ask the same question. The citation changes to **§2.1**: one pet, dogs under 25 lb. "It only ever sees the active building's documents."
16. Ask "What is the Wi-Fi password?". The reply is **"I don't know. Please message your coordinator."** with a button. Point at the **Answer mode: Retrieval** badge: Claude is used only if a key is configured, and anything that fails falls back to retrieval.

**4:40 Dashboard (20s)**
17. Sign in as **Helena Brightwater**. The KPI tiles show open requests by building, average time to resolve, overdue by urgency (High 2, Normal 1, Low 1), and workload (Grace 14 vs Theo 6). Toggle **Show table** on one chart. "Every chart has an accessible table alternative."

**5:00 Close (optional, if asked)**
Show `npm run check`, the CI run (quality → unit + e2e + storybook), a Cypress run with cypress-axe, and Storybook with the a11y panel.

## Fallbacks
- If something goes wrong mid-demo, choose **Reset demo data** in the user menu and continue from the current step.
- If the emergency KW-1030 was already resolved in a rehearsal, use **KW-1029 (Maple Court, No heat)** for step 10.
