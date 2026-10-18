# Keyway house rules corpus

These are fictional house rules, one document per building, with 12 passages each. They are also in `seed.json` (`ruleDocuments`, `rulePassages`), and the passage ids are stable. The assistant must answer **only** from the passages of the active building. When nothing scores above the threshold, it replies exactly: **"I don't know. Please message your coordinator."**

How the buildings differ (these should visibly change the citations when you switch building):

| Topic | Harbor View Lofts | Maple Court | The Linden |
|---|---|---|---|
| Quiet hours | 9 PM–8 AM daily (strict, fines) | 10 PM–7 AM weekdays, 11 PM–8 AM weekends | 11 PM–7 AM |
| Pets | up to 2 dogs/cats, no size limit, $300 one-time | 1 cat or dog <25 lb, $35/month | up to 2, dogs <50 lb, $40/month each |
| Laundry | shared room, 2nd floor | basement only; **no in-unit appliances** | in-unit washer-dryer |
| Entry | office | keys; no lock changes | **smart locks**, one-time vendor codes |
| Painting | drywall any colour; never brick/beams | approved palette; lead caution | approval + palette |

## Harbor View Lofts (`bld_harbor`)

*Harbor View Lofts House Rules & Lease Addendum, effective 2026-01-01.*

### `hvl-quiet-hours`: 2.1 Quiet hours
Quiet hours are 9:00 PM to 8:00 AM every day. During quiet hours, keep music, TV and voices at a level that cannot be heard in hallways or neighbouring lofts. Lofts have exposed concrete and open ceilings, so sound travels; cover at least 80% of hard floors with rugs. Repeated quiet-hours complaints lead to a written warning, then a $100 fine per incident.

### `hvl-pets`: 3.1 Pets
Harbor View Lofts is pet-friendly. Each loft may keep up to two dogs or cats, with no breed or weight limit. Register every pet with the management office within 14 days of move-in, including vaccination records. A one-time fee of $300 per pet applies; there is no monthly pet fee.

### `hvl-pet-areas`: 3.2 Pet areas and waste
Dogs must be leashed in all common areas, including elevators and the lobby. Use the dog-wash station on garage level P1 and the pet relief area in the north courtyard. Pick up after your pet immediately; unattended pet waste is a $50 fine.

### `hvl-guests`: 4.1 Guests and subletting
Guests may stay up to 14 nights in any 6-month period without approval. Longer stays need a guest registration with the office. Subletting your loft, including short-stay listings, is not permitted.

### `hvl-parking`: 5.1 Parking and bicycles
Each loft is assigned one garage space on P1 or P2; your space number is on your lease. The garage is for residents only; guests park on the street. Store bicycles in the bike room off the lobby or inside your loft, never in hallways or stairwells.

### `hvl-packages`: 6.1 Packages
Packages are delivered to the smart lockers in the lobby and you receive a pickup code by email. Collect packages within 3 days; after that they move to the office, open weekdays 9 AM to 5 PM. Perishable deliveries are not held.

### `hvl-moving`: 7.1 Moving in and out
Book the freight elevator through the office at least 5 days before your move. Moves are allowed Monday to Saturday, 9:00 AM to 6:00 PM, and must finish before quiet hours begin. A refundable $250 elevator deposit is required; staff install wall padding.

### `hvl-painting`: 8.1 Painting and walls
You may paint interior drywall any colour, but exposed brick, concrete and timber beams must never be painted, drilled or sealed. Use the picture rail or removable hooks to hang art. Return drywall to the original white before you move out, or a repainting charge is deducted from your deposit.

### `hvl-balconies`: 9.1 Balconies
Balconies may hold outdoor furniture and plants in saucers. Gas or charcoal grills, open flames, and laundry hung over railings are not allowed. Electric grills are permitted. Do not feed gulls or other birds from your balcony.

### `hvl-smoking`: 10.1 Smoking and vaping
Smoking and vaping of any substance are prohibited inside lofts, on balconies, and within 25 feet of building entrances. The designated smoking area is the bench at the south end of the pier walk.

### `hvl-laundry`: 11.1 Laundry
Lofts do not have in-unit laundry. The shared laundry room on the 2nd floor is open 7:00 AM to 9:00 PM and closes when quiet hours begin. Pay for machines in the resident app, and remove laundry within 15 minutes of the cycle ending.

### `hvl-emergencies`: 12.1 Emergencies
For fire, a gas smell or active flooding, leave the area and call 911 first, then call the 24-hour maintenance line at (555) 010-4400 and submit an Emergency request in Keyway. Each loft's main water shutoff is behind the access panel under the kitchen sink.

## Maple Court (`bld_maple`)

*Maple Court Resident Handbook, effective 2025-07-01.*

### `mpc-quiet-hours`: 1.1 Quiet hours
Quiet hours are 10:00 PM to 7:00 AM Sunday to Thursday, and 11:00 PM to 8:00 AM on Friday and Saturday. Floors are original hardwood over plaster, so take off hard-soled shoes indoors where you can and avoid moving furniture late in the evening.

### `mpc-pets`: 2.1 Pets
One pet per home is allowed: either a cat or a dog under 25 lb. Small birds and fish tanks under 20 gallons are also allowed. Reptiles, rodents and exotic animals are not permitted. The office must approve every pet before it moves in, and a $35 monthly pet fee applies.

### `mpc-laundry`: 3.1 Laundry and appliances
Maple Court's plumbing and wiring were not designed for in-unit appliances. Do not install a washing machine, dryer or dishwasher, and do not alter water lines, laundry hookups or dryer vents. Use the basement laundry room, open 6:00 AM to 10:00 PM, which takes coins or cards.

### `mpc-heating`: 4.1 Heating and radiators
The building boiler supplies heat from October 1 to April 30. Radiators can take up to an hour to warm up. Do not paint, cover or bleed radiators yourself; submit a Heating & cooling request instead. Portable space heaters must have an automatic tip-over shutoff and must never run unattended.

### `mpc-alterations`: 5.1 Alterations
Get written approval from the office before any alteration, including replacing light fixtures, mounting shelves heavier than 20 lb, changing locks or removing carpet. Original moulding, doors and built-in cabinets must stay in place. Unapproved alterations are restored at the resident's cost.

### `mpc-painting`: 5.2 Painting
Walls may be painted only in colours from the Maple Court approved palette, available from the office. Some original coats may contain lead, so never sand or scrape existing paint; submit a request for any peeling or chipped paint.

### `mpc-guests`: 6.1 Guests
Overnight guests may stay up to 7 consecutive nights and no more than 30 nights per year. Do not give building keys to guests. Subletting is not permitted.

### `mpc-parking`: 7.1 Parking
The rear lot has 18 unassigned spaces, first come first served, for cars with a Maple Court permit sticker. Visitors may use the 4 marked spaces by the gate for up to 24 hours. Cars without a permit are towed at the owner's expense.

### `mpc-packages`: 8.1 Packages
There is no package room. Carriers leave packages in the locked vestibule by the mailboxes. Maple Court is not responsible for lost or stolen packages, so consider a carrier pickup point for valuable items.

### `mpc-moving`: 9.1 Moving in and out
Moves are allowed Monday to Saturday, 8:00 AM to 8:00 PM. There is no elevator. Tell the office 48 hours before a move so neighbours can be notified, and protect stair railings and walls; damage to common stairwells is charged to the resident.

### `mpc-smoking`: 10.1 Smoking
Maple Court is smoke-free indoors, including homes, hallways and the basement. Smoking is allowed only in the gazebo by the rear lot. Put cigarette ends in the receptacle provided.

### `mpc-emergencies`: 11.1 Emergencies
For fire or a gas smell, leave and call 911. For a burst pipe, or no heat when the temperature inside drops below 55°F, call the 24-hour line at (555) 010-2210. Shutoff valves for each riser are in the basement and only staff may operate them.

## The Linden (`bld_linden`)

*The Linden Community Policies, effective 2025-09-15.*

### `lin-quiet-hours`: 1.1 Quiet hours
Quiet hours are 11:00 PM to 7:00 AM. Homes have acoustic underlayment, but keep amplified speakers and exercise equipment away from shared walls. The rooftop terrace closes at 10:00 PM.

### `lin-smart-locks`: 2.1 Smart locks and entry
Every home has a smart lock you open with the resident app or keypad. Never share your personal code. For a guest, cleaner or vendor, create a time-limited guest code in the app. Maintenance staff and vendors use one-time codes logged to your request, so you don't need to be home when you give permission to enter.

### `lin-lockouts`: 2.2 Lockouts and lock batteries
If both your phone and keypad code fail, call the front desk (staffed 7 AM to 11 PM) or the 24-hour line. Locks have a backup battery; if the keypad shows a red battery icon, submit a Doors & locks request. Do not remove or replace lock hardware yourself.

### `lin-pets`: 3.1 Pets
Up to two pets per home: cats, or dogs under 50 lb. Register pets in the resident app before they move in. A $40 monthly pet fee applies per pet. Use the dog run on level 2; dogs are not allowed on the rooftop terrace.

### `lin-laundry`: 4.1 In-unit washer-dryer
Each home has a ventless washer-dryer. Clean the lint filter after every cycle and only run the machine when someone is home. Do not replace or move the unit; submit an Appliance request for any problem.

### `lin-alterations`: 5.1 Alterations and painting
You may hang art with small nails. Painting needs approval and must use a colour from the approved palette. Do not mount a TV on a wall that holds the smart-home panel, and never drill into floors or ceilings, which contain radiant heating lines.

### `lin-guests`: 6.1 Guests
Guests may stay up to 21 nights in any 6-month period. Give guests a guest code instead of sharing yours. Subletting and short-stay listings are not permitted.

### `lin-parking`: 7.1 Parking and EV charging
Garage spaces are leased separately through the office. The six EV charging stations on P1 are shared; unplug and move your car within 30 minutes of a full charge. Overstay fees are billed through the resident app.

### `lin-packages`: 8.1 Packages
Packages go to the package room on the ground floor, which you open with the smart-lock app. Refrigerated lockers hold groceries for up to 24 hours. Packages left longer than 7 days are returned to the sender.

### `lin-moving`: 9.1 Moving in and out
Reserve the service elevator in the resident app at least 72 hours ahead. Moves are allowed every day from 8:00 AM to 7:00 PM through the loading dock on Linden Rise; the main lobby may not be used for moves.

### `lin-balconies`: 10.1 Balconies and smoking
The Linden is fully smoke-free and vape-free, including balconies and the rooftop terrace. Only electric grills are allowed on balconies. Do not store anything above railing height.

### `lin-emergencies`: 11.1 Emergencies
For fire, smoke or a gas smell, leave and call 911. For a water leak, close the shutoff valve in your laundry closet, call the 24-hour line at (555) 010-7730, and submit an Emergency request. Leak sensors under sinks also alert staff automatically.

## Sample questions (expected citations)

These were checked against a simple BM25 over `title + text`. The settings: lowercase, alphanumeric tokens, a stopword list (including *have, has, can, i, my*), naive plural stemming (strip `ing`/`es`/`s` when the word is longer than 3 letters), k1 = 1.2, b = 0.75. A passage is cited when its score is **≥ 1.5 and ≥ 50% of the top score**, up to 3 passages. If the top score is below 1.5, the answer is "I don't know".

| # | Building | Question | Must cite (first) | May also cite |
|---|---|---|---|---|
| 1 | Harbor View Lofts | How many dogs or cats can I keep? | `hvl-pets` | |
| 2 | Maple Court | How many dogs or cats can I keep? | `mpc-pets` | |
| 3 | The Linden | How many dogs or cats can I keep? | `lin-pets` | |
| 4 | Harbor View Lofts | What are the quiet hours? | `hvl-quiet-hours` | `hvl-laundry`, `hvl-moving` |
| 5 | Maple Court | Can I install a washing machine in my apartment? | `mpc-laundry` | |
| 6 | The Linden | How do I let a vendor in when I'm not home? | `lin-smart-locks` | |
| 7 | Harbor View Lofts | Can I paint the brick wall? | `hvl-painting` | |
| 8 | Maple Court | Who do I call if there is no heat? | `mpc-emergencies` | `mpc-heating` |
| 9 | The Linden | Where are the EV charging stations? | `lin-parking` | |
| 10 | Harbor View Lofts | Can I use a charcoal grill on my balcony? | `hvl-balconies` | |

Questions 1–3 are the isolation demo: the same question gives three different answers and citations.
Bonus checks: "How long can overnight guests stay?" at Maple Court should cite `mpc-guests`. "How long are packages kept in the package room?" at The Linden should cite `lin-packages`.

## Must return "I don't know" (in every building)

1. "What is the Wi-Fi password?"
2. "Is there a swimming pool or gym?"
3. "How do I pay my rent online?"

None of these words appear in any passage, so all of them score 0. Keep it that way: don't add "rent", "wifi", "password", "pool", "gym" or "online" to the corpus.

## Claude mode (only when ANTHROPIC_API_KEY is set)

Send the top 5 retrieved passages (id, section, title, text) and the question. The system prompt says: answer only from these passages, cite with [n] matching the given order, use at most 3 sentences, and if they don't answer the question, reply exactly with the fallback sentence. Validate the response so that every [n] maps to a provided passage. On any violation, timeout (8s) or error, fall back to retrieval mode.
