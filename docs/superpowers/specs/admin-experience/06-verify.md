# Mini 06 — Verify

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)
**Needs:** Minis 00–05

## Intent

Prove the contract with greps and the existing tour/chrome tests. No new product behaviour.

## Done when

These commands are clean for **admin chrome** (exclude message-body prose, `HeroLivePreview`, Impulsa, public landings, inputs):

```bash
rg '<h1' src/components/dashboard/admin/cms src/components/dashboard/admin/site-setup src/components/dashboard/admin/cms/blog/BlogArticleEditor.tsx
rg 'h1[^\n]*--color-secondary' src/app/\[locale\]/dashboard/admin src/components/dashboard src/components/organisms --glob '*.tsx'
```

`tourAnchorDomPresence` still passes. `StaffChromeThemeTokens` still passes.

## Out of scope

Writing new product tests beyond the greps and the tests added in earlier minis.
