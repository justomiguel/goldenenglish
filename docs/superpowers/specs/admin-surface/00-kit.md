# Mini 00 — Admin surface kit

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)

## Intent

Ship the three primitives later minis must reuse. No product page changes in this mini except what a primitive test renders.

## Done when

- `adminSurfaceIcon` returns a node for every id in the umbrella table and `null` for an unknown id.
- `AdminPageHeader` renders a tinted banner: title in primary (not secondary), optional lead, optional white icon tile, decorative art, optional actions, optional `data-tour`.
- `AdminSurfaceCard` is a white rounded-2xl bordered card.
- Tests cover those three facts and do not import Next.js pages.

## Out of scope

Wiring any real admin route. Drawer. Instituto tiles.

## Files

- Create: `src/lib/dashboard/adminSurfaceIcon.tsx`
- Create: `src/components/dashboard/AdminPageHeader.tsx`
- Create: `src/components/dashboard/AdminSurfaceCard.tsx`
- Test: `src/__tests__/lib/dashboard/adminSurfaceIcon.test.tsx`
- Test: `src/__tests__/components/dashboard/AdminPageHeader.test.tsx`
