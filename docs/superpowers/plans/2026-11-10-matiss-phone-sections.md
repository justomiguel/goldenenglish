# Matiss phone sections

Spec: `docs/superpowers/specs/2026-11-10-matiss-phone-sections-design.md`

## Steps

1. Pure gallery helpers and a failing carousel test. Position is 1-based.
2. Client gallery carousel for mosaic and pages. Track `click` on `gallery:matiss`.
3. Phone FAQ with one visible answer. Desktop FAQ stays on `details`.
4. Hook for `(max-width: 1023px)`. Skeleton until mount.
5. Phone composer: 12 snap screens. Age finder is its own screen. Contact and footer share the last screen.
6. Desktop composer stays a flowing page. Age finder stays inside groups.
7. Fixed header on the phone tree. Sticky header on the desktop tree.
8. Compact CSS in `src/styles/matissPhoneSections.css`.
9. Dictionary keys in `en.json`, `es.json`, and `pt.json`.
10. Pulsar changelog row `matiss-phone-sections`. Do not apply it in this step.
