# Mozarthitos FAQ metrics

1. Add `public.faq_metric_events`, `record_faq_metric`, and `faq_admin_stats_30d`.
2. Add `POST /api/faq/metrics` with cookie `ge_faq_vid` and a private response.
3. Send `visit` on accordion mount and `open` when a question opens.
4. Render one card on the admin home when the owned gate says the theme is Mozarthitos.
5. Cover the route, the parser, the accordion post, the gate, and the card codes.
