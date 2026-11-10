# PWA install icons

Spec: `docs/superpowers/specs/2026-11-10-pwa-install-icons-design.md`

1. Manifest icons for a lone PNG point at `/pwa/icon/192` and `/pwa/icon/512`. Ico and Storage bundles stay on their sibling files.
2. `GET /pwa/icon/[size]` returns a PNG of 180, 192, or 512. The source is the brand logo, then the favicon, then a letter mark.
3. The document head uses `/pwa/icon/180` when no apple-touch sibling exists.
4. `proxy` leaves `/pwa/icon/192` without a locale prefix.
5. Changelog row for staff. Short ADR for the public route.
