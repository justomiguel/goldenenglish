# Readable text on the Mi Mundo family portal

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 3 of 8
**Closes:** F17
**Related:** `supabase/migrations/134_site_theme_mimundo_seed.sql`,
`supabase/migrations/124_site_themes_accessible_contrast.sql`,
`src/lib/theme/systemPropertiesDefaults.ts`

## Intent

On the Mi Mundo family portal at phone width, the greeting, the child's name, the
"Novedades" heading and the "Ver blog" / "Ver eventos" links are brown-on-brown. The links
measure 1.08:1 against their background. WCAG AA asks for 4.5:1. They are, in practice,
invisible.

## Context

The audit reported this as a component problem. It is not: **no component hardcodes a
colour, and every one of them uses the theme variables correctly.** The same components
render perfectly on every other tenant.

The cause is one value in one database row. Colour tokens come from
`SYSTEM_PROPERTIES_DEFAULTS`, overlaid per tenant by `site_themes.properties` and injected
as a `:root` style block by `src/app/layout.tsx:99`. The Mi Mundo seed sets:

```
'color.muted', '#8D6E63',   -- medium warm brown
```

`--color-muted` is the page wash: `ParentPwaShell.tsx:43` paints the whole mobile portal
with `bg-[var(--color-muted)]`. On every other tenant that token is a near-white tint —
the default is `#F0EFEA`. Mi Mundo's is a mid-tone brown, so every piece of text in the
brand's warm-brown and olive family lands within a point or two of the background's
luminance.

Reading the seed confirms the mistake was inadvertent: every other colour in it carries a
comment justifying its contrast ("pasa AA como bg para texto blanco", "≥ 4.5:1 sobre
crema"). `color.muted` is the only one with no comment at all. It was picked as a brand
brown without anyone noticing it doubles as a page background.

There is precedent for the fix. `124_site_themes_accessible_contrast.sql` patched exactly
this class of problem for `minimal`, `nago`, `mozarthitos` and `golden-english`. Mi Mundo
was simply not in that migration — its seed landed ten migrations later.

### The tab bar is the same bug wearing a disguise

The bottom tab bar measured 4.11:1, and its background is `--color-surface`, a cream that
should be fine. The bar is painted `bg-[var(--color-surface)]/95`, so five per cent of the
brown wash bleeds through and drags the effective background down. Correcting the wash
lifts the bar to 4.59:1 with no change to the bar itself.

## Decisions

| Topic | Choice |
|-------|--------|
| Where to fix | The database, via a migration. No component or CSS changes |
| `color.muted` | `#8D6E63` → `#F2E9E1`, a light warm wash in the same family |
| `color.primary` | `#557945` → `#4E7040` |
| Guard against recurrence | A pure `contrastRatio` utility plus a test pinning the default palette |
| Schema | Untouched. `UPDATE` of one JSONB column on one row |

### Why `color.primary` also has to move

Correcting the wash alone fixes four of the five failures. The "Ver blog" / "Ver eventos"
links land at 4.16:1 — still short of 4.5:1 — because they paint `--color-primary` on the
wash. `#4E7040` is the smallest darkening of the brand olive that clears every pair it
participates in, and it is close enough to the original to read as the same colour. Darker
candidates were measured and rejected as unnecessary: there is no reason to move a brand
colour further than the requirement demands.

This is a real palette constraint, not a workaround for two links: `--color-primary` is
used for links and accents across surfaces the wash sits behind, so it has to be readable
on it.

### Verified ratios

Computed with the WCAG 2.1 relative-luminance formula. The tab bar row composites
`surface` at 95% over the wash, as the browser does.

| Pair | Today | After | Needs |
|------|-------|-------|-------|
| Greeting h1 — `foreground` on wash, 20px bold | 1.65 | **6.35** | 3.0 |
| Child name and instruction — `muted-foreground` on wash, 14px | 2.02 | **7.77** | 4.5 |
| "Novedades" — `muted-foreground` on wash, 11px | 2.02 | **7.77** | 4.5 |
| "Ver blog" / "Ver eventos" — `primary` on wash, 12px | 1.08 | **4.71** | 4.5 |
| Active tab label — `primary` on 95% surface over wash, 10px | 4.11 | **5.20** | 4.5 |

Pairs that must not regress, after the change:

| Pair | After | Needs |
|------|-------|-------|
| `foreground` on `background` | 7.21 | 4.5 |
| `muted-foreground` on `surface` | 8.62 | 4.5 |
| `primary` on `surface` | 5.23 | 4.5 |
| `primary` on `background` | 5.35 | 4.5 |
| white on `primary` (solid buttons) | 5.65 | 4.5 |
| `accent-foreground` on `accent` | 5.32 | 4.5 |
| `border` on wash (non-text) | 3.17 | 3.0 |

## Architecture

### The migration

`supabase/migrations/<next>_site_theme_mimundo_contrast.sql`, following the shape of
migration 124 exactly: a single `UPDATE public.site_themes` merging a `jsonb_build_object`
over `properties` with `updated_at = now()`, keyed on `slug = 'mimundo'`. It patches
`color.muted` and `color.primary` and nothing else. Idempotent, additive, reversible, no
schema change, no data loss.

### The guard

New: `src/lib/theme/contrastRatio.ts`

```ts
export function relativeLuminance(hex: string): number
export function contrastRatio(a: string, b: string): number
```

Pure functions over `#RRGGBB`. The repo has no contrast computation of any kind today —
migration 124's numbers were worked out by hand and left no trace in code, which is part
of why Mi Mundo slipped through.

A test then pins `SYSTEM_PROPERTIES_DEFAULTS` against the pairs the shells actually
compose, so the defaults every tenant inherits from can never drift below AA.

**This guard would not have caught Mi Mundo, and the spec does not pretend otherwise.**
Tenant palettes live in the database, not the repo, so no unit test can see them. What
the utility does give is a reviewable way to check a palette; the runbook change tells
people to use it.

### Runbook

`docs/runbooks/accessibility-multi-tenant.md` gains a short section: when adding or editing
a tenant palette, check the composed pairs with `contrastRatio`, and remember that
`color.muted` is a page background rather than a decorative brand colour.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **`contrastRatio`** — known reference values: black on white is 21:1, white on white is
   1:1, and `#767676` on white is 4.54:1 (the canonical AA boundary grey). Order of
   arguments does not change the result. Accepts lowercase and uppercase hex.
2. **`relativeLuminance`** — 0 for black, 1 for white.
3. **Default palette holds AA** — for `SYSTEM_PROPERTIES_DEFAULTS`: `foreground` on
   `background`, `foreground` on `surface`, `muted-foreground` on `surface`,
   `muted-foreground` on `muted`, `foreground` on `muted`, `primary` on `surface`,
   `primary` on `muted`, and `primary-foreground` on `primary` all reach 4.5:1.
4. **The corrected Mi Mundo pairs** — a table-driven test over the palette the migration
   produces, asserting each of the five fixed pairs and the seven non-regression pairs
   above. The palette values are declared as a literal in the test with a comment pointing
   at the migration as their source; the test's job is to pin the arithmetic behind the
   chosen values, not to read the database.

## Done when

1. Every one of the five audited elements reaches its WCAG AA threshold on Mi Mundo.
2. No component, CSS file or theme default changes.
3. The seven listed pairs do not regress.
4. The migration is idempotent and touches one row.
5. `contrastRatio` exists, is tested, and the defaults are pinned by a test.
6. The runbook says how to check a tenant palette.

## Out of scope

- **Mi Mundo inherits `color.primary.light` `#2A5B84` and `color.primary.dark` `#0A253D`,
  both navy, because its seed never overrode them.** Those tokens are used in more than
  forty components, so an olive brand currently renders navy hovers and gradients. It is a
  genuine defect, but it is brand consistency rather than contrast, it was not measured in
  the audit, and it changes the public landing pages, which need visual QA this spec has
  no way to give. Recorded in the program document as follow-up.
- Contrast on other tenants. Migration 124 covered them; re-auditing is separate work.
- Any warning in the admin theme editor when a chosen palette fails AA. That is the real
  systemic fix and deserves its own spec.
- Automated Lighthouse coverage, which the runbook already describes.

## Manual QA (Mi Mundo tenant, phone width)

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. `npm run dev:mimundo`, log in as a parent, open `/es/dashboard/parent` at 390 px.
2. The greeting, the child's name, the "Novedades" heading and both "Ver" links are all
   comfortably readable.
3. The page still looks like Mi Mundo: the wash is a warm cream, the green is still the
   logo green.
4. Solid green buttons still have readable white labels.
5. Check the public landing page too, since `color.primary` moved.
