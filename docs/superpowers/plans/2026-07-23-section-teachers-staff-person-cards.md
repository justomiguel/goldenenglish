# Plan — Section teachers assigned person cards

**Spec:** `docs/superpowers/specs/2026-07-23-section-teachers-staff-person-cards-design.md`

## Steps

1. **RED** — Loader test: assigned lead/assistants map phone/DNI/avatar/email; Vitest RTL for card list (avatar fallback, profile link, externals unlinked).
2. **GREEN** — Extend staff load path with assigned portal summaries + email resolve; replace chips UI with person cards + external rows.
3. **Wire** — Section page / shell body pass new props + locale.
4. **i18n** — open-profile aria, field labels; update empty copy if needed.
5. **Verify** — targeted vitest green.
