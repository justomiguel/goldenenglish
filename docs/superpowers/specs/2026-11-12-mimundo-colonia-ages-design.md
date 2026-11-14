# Mi Mundo colony ages

**Intent:** The colony section and the public colony answer say ages 3 to 12. The kindergarten range is 45 days to 5 years. Use that same range in both sentences.

**Done when:**

- `landing.mm.colonia.bodyP2` in `en.json`, `es.json`, and `pt.json` says from 45 days to 5 years.
- `publicAnswers.kinds.mimundo` item `colony` uses the same range in the three locales.
- Neither sentence still says 3 to 12.
- A test fails if the colony answer or the colony paragraph returns to 3 to 12.

**Out of scope:** Gallery photos. Classroom age labels. CMS overrides already saved in a tenant database.

## Surfaces (Web vs PWA)

Public marketing landing and the public answer page. Tier A. `MiMundoColoniaSection` is one shared organism. No separate PWA colony tree. The answer page reads the same dictionary. Web and narrow widths show the same sentences.
