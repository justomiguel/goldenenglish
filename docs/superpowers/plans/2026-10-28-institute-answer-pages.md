# Institute answer pages

Spec: `docs/superpowers/specs/2026-10-28-institute-answer-pages-design.md`

## Steps

1. Add `publicAnswers` to `en.json`, `es.json`, and `pt.json`. Same question ids. Answers use only published facts.
2. Add `src/lib/public/instituteAnswerPages.ts` for kind mapping, placeholder contact filter, and FAQ JSON-LD.
3. Add `/{locale}/preguntas`. Pulsar returns 404. Footer link next to privacy. Sitemap includes the path for institutes only.
4. Set `Brand — Tagline` on the home `<title>`, add per-page `alternates` on `/preguntas`, `/privacidad`, and `/contact`, and filter placeholder contact fields in `JsonLdOrganization`.
5. Set Open Graph locale by country. Add Liora department places in Organization JSON-LD.
6. Tests lock ids, reject placeholder contact, check FAQPage, home title, Organization JSON-LD, Open Graph locale, and Liora departments.

## Out of scope

Prices, uniforms, class ratios, food, adaptation, unconfirmed press claims, Google Business Profile.
