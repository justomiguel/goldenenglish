# Flow prices on event surfaces

**Intent:** When an event charges a different price per registration flow, show each flow with its price on the admin events table, the public events list, the public event page, and the registration form. The registration price sits beside the flow option and reads as the amount, not as secondary help text.

**Done when:**

- An event with `price_by_flow` lists every active flow as name plus formatted amount in the admin price column, on `/events`, and on `/events/[slug]`.
- The same list replaces the single event price on those three surfaces. Residency tiers and ticket packages stay as they are when the event is not priced by flow.
- On registration, each flow radio shows its amount on the same row, in semibold type, using the currency formatter. A single flow (no radio) still shows that amount above the form.
- Amounts use `formatEventMoneyAmount`. A price of 0 uses the existing “free” copy.
- Tests cover the public price list, the admin cell, and the registration option.

**Out of scope:** Changing how a flow price is stored or charged. The home popup. Events that are not priced by flow.
