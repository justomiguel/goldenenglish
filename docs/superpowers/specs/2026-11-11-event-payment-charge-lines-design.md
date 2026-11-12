# Event payments — always show the ticket lines

**Intent:** In admin event payments, every priced registration shows how many tickets were bought and at what unit price.

**Done when:** A payment row with a computed charge shows `Adultos: {count} × {price}` under the total. A row with minor tickets also shows `Menores: {count} × {price}`. A row with a code or a family discount still shows that discount line. A row with no computable price stays total-only.

**Out of scope:** Changing the charged amount. The public registration form. Parent or student payment screens. New copy. An ADR.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The screen is `AdminEventPaymentReviewRow` on the admin event detail payments tab. Parent and student payment PWA trees are other flows. This change does not alter their props, hooks, or actions.

## Behavior

Today the loader drops `chargeLines` unless the row has minor tickets or a discount. The component returns nothing in that same case. A plain adult purchase shows only the total.

After the change:

1. If `shownEventChargeView` returns a view, pass that view as `chargeLines`.
2. Render the adult line whenever the view exists.
3. Render the minor line only when `minorTickets > 0`.
4. Render the discount line only when a discount exists.
5. If the view is null, keep `chargeLines` null. The row shows the stored total and no ticket lines.

Seat count stays `1 + companions`. Unit price stays the price the registration form already uses (event, local, flow, or package).

## Tests

- `AdminEventPaymentChargeLines`: a plain adult row shows the adult line. A minor row still shows both lines. A discount-only row shows the adult line and the discount line.
- The payments loader test, if one exists for this map, expects `chargeLines` on a plain adult row. If no loader test covers the map, the component test is enough for this slice.
