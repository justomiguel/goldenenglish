# Event sale pulse

## Intent

At the start of an event admin page, staff see how enrollment and sales are going. When seats remain, the line shows the free count and the free percent of capacity.

## Done when

- The pulse sits under the event title and above the tabs.
- It states confirmed enrollments and payments that still await review.
- It states the approved payment count.
- When seats remain, it states the free count and the free percent.
- When no seats remain, it states that no seats are free.
- Occupied seats match the enroll rule: `confirmed` plus `pending_payment`.
- Copy is in `en.json`, `es.json`, and `pt.json`.

## Out of scope

- Changing capacity math in the enroll RPC.
- A money total. Approved payments are a count.
- Public event pages.

## Surfaces (Web vs PWA)

Tier B — desktop-only admin event detail. No PWA tree reads this page.
