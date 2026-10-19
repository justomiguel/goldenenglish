# Hide Mercado Pago on event registration when the gateway is off

**Intent:** Public event registration must not offer Mercado Pago (or Flow) unless that gateway’s saved credentials are enabled. A return from a disabled gateway must not stay on “processing”, which sends the payer back into registration in a loop.

**Done when:**
- The registration payment list includes an online gateway only when `loadMercadoPagoCredentialsPlain` / `loadFlowChileCredentialsPlain` reports `enabled`.
- Starting checkout still refuses a disabled gateway (`method_unavailable`).
- The register form does not start an online checkout for a method that is not in that list, and does not default the choice to Flow when Flow is not allowed.
- Mercado Pago or Flow return reconciliation reports `failure` when credentials are missing or disabled, so the public banner does not stay on “processing”.

**Out of scope:** Changing how credentials are stored, monthly tuition, shop, or enrollment pay screens, and turning bank transfer on or off.
