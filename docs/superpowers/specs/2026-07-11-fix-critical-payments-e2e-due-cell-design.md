# Fix critical payments E2E due-cell locators

**Intent:** Student/parent payment E2Es must click a **visible** pending monthly cell (`Pago pendiente` / `Pending payment`), not assume calendar current/next month labels (`jul` / `ago`) match the strip (strip may show later due months when current is already settled).

**Done when:** `critical-payments.spec.ts` and `critical-parent-payments.spec.ts` locate `.first()` pending due button (suite is `workers: 1`); both pass against the isolated stack.

**Out of scope:** Changing seed SQL or billing cell generation (follow-up if seed should always reset Jul/Aug into the strip).
