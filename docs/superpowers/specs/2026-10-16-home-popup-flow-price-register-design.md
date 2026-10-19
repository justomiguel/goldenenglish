# Home popup flow prices and registration link

**Intent:** The home event popup lists each registration-flow price when the event charges by flow, and its button opens registration.

**Done when:**

- A `price_by_flow` event in the popup shows each active flow name with its formatted amount, in place of the single event price.
- An event that is not priced by flow keeps the current price display.
- The popup button reads “Ir al registro” / “Go to registration” / “Ir para a inscrição” and links to `/{locale}/events/{slug}/register`.

**Out of scope:** The public list and event page. How a flow price is stored.
