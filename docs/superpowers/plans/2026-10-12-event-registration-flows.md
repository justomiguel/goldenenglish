# Event registration flows

Spec: `docs/superpowers/specs/2026-10-12-event-registration-flows-design.md`

1. Pure resolver and seat price, with tests.
2. Validator filters fields by the chosen flow.
3. Migration `210` (flows, `flow_id`, `price_by_flow`, `registration_flow_id`) and admin actions.
4. Form-tab UI and public form (choice, fields, amount).
5. Enroll persists the flow and charges its price when the switch is on. Gateway amount uses the same rule.
6. Dictionaries, ADR, changelog, `masterdb.sql`.
