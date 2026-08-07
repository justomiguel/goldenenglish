# Dangerous actions look dangerous, not important

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 8 of 8
**Closes:** F16, F19
**Related:** `src/components/atoms/Button.tsx`, `AcademicSectionLifecycleActions`,
`AcademicCohortLifecycleBar`, `DeletePortalMessageButton`, `DeleteUsersConfirmModal`,
`BlogArticleEditorDeleteControls`, `AdminEventAttendeeDeleteButton`,
`SectionCollectionsScholarshipRemoveButton`, `src/dictionaries/{en,es,pt}.json`

## Intent

Open an academic section and the two loudest controls on the page are "Archivar sección"
and "Eliminar definitivamente". Everything you would actually come to do is quieter than
the two things you would most regret doing by accident.

## Context

### F16 is a missing abstraction, not a styling slip

`Button` offers `primary`, `secondary` and `ghost`. **There is no destructive variant.** So
every dangerous action in the codebase invents its own, and they have all invented
something different:

| Where | How it styles danger |
|-------|----------------------|
| `AcademicSectionLifecycleActions` | `variant="secondary"` plus an error border and error text |
| `AcademicCohortLifecycleBar` | the same override, copied |
| `DeletePortalMessageButton` | the same override, copied again |
| `DeleteUsersConfirmModal` | no variant; `!bg-[var(--color-error)] !text-white` with `!important` |
| `BlogArticleEditorDeleteControls` | a raw `<button>`, bypassing the atom entirely |
| `AdminEventAttendeeDeleteButton` | `variant="ghost"` plus error classes |
| `SectionCollectionsScholarshipRemoveButton` | `variant="ghost"` plus error classes, different sizing |

On the section page the problem compounds: `variant="secondary"` is a **solid** fill, so
"Archivar sección" is a solid coloured button, and the hub view it sits above contains no
`Button` at all — the area cards are divs. The two lifecycle actions are therefore the only
buttons on the first screen a user sees.

### The copy already admits the layout is confusing

`dashboard.academicSectionPage.shellTabs.generalLead` currently reads, in part,
"**Archivar y eliminar están arriba a la derecha**". The interface is explaining its own
furniture — which is F19 — and it is doing so about the very controls F16 says are too
loud. Fix the weight and the sentence stops being needed. This is why the two findings
share a spec.

The audit's F19 sweep found the problem is small and concentrated: of 46 raw matches, once
tour copy and ARIA labels are excluded, **nine prose strings** reference layout, and only
five should change. Four are legitimate and stay.

## Decisions

| Topic | Choice |
|-------|--------|
| The abstraction | Two new `Button` variants: `destructive` and `destructiveStrong` |
| `destructive` | Quiet: transparent, error-coloured **border**, ordinary foreground text |
| `destructiveStrong` | Solid error fill with white text. Only inside a confirmation dialog |
| Red text | **Not used.** It fails contrast on a live tenant — see below |
| Archive | Not destructive. It is reversible, and there is a "Restaurar" action. Becomes `ghost` |
| Ad-hoc overrides | All seven call sites migrate to the variants. No `!important` survives |
| Copy | Five strings rewritten to drop positional references. Four kept |
| Tour copy | Untouched |

### Why the label is not red

Every existing destructive button colours its **text** with `--color-error`. Measured with
the `contrastRatio` utility added in spec 3:

| Pair | Ratio | Needs |
|------|-------|-------|
| Default error `#DC2626` on white | 4.83 | 4.5 ✓ |
| Default error on default background `#FAF9F6` | 4.59 | 4.5 ✓ |
| **Mi Mundo error `#E22E30` on its surface `#FAF6EA`** | **4.16** | 4.5 ✗ |
| **Mi Mundo error on the page wash `#F2E9E1`** | **3.75** | 4.5 ✗ |
| White on default error | 4.83 | 4.5 ✓ |
| White on Mi Mundo error | 4.50 | 4.5 ✓ |

So today's pattern already fails on a live tenant, and promoting it to a shared variant
would turn an accident into a standard. A **border** carries the same warning at the 3:1
non-text threshold, which every tenant clears, while the label stays in `--color-foreground`
and is readable everywhere. White on a solid error fill passes on every tenant, which is
why `destructiveStrong` is safe where it is used.

The danger signal is therefore carried by the border, the icon and the word itself, not by
a colour that some tenants cannot render legibly.

### Why archive stops being treated as dangerous

Archiving is reversible — the same component offers "Restaurar sección". Dressing a
reversible action in danger styling spends the user's alarm on the wrong control and leaves
nothing louder for deletion. It becomes `ghost`.

## Architecture

### `src/components/atoms/Button.tsx`

Two entries added to `variantClasses`:

- `destructive` — `bg-transparent`, `border border-[var(--color-error)]`,
  `text-[var(--color-foreground)]`, a faint error-tinted hover, focus ring on
  `--color-error`. **No hover scale.** The other variants grow slightly on hover; an
  inviting animation is wrong on a control whose best outcome is that you do not press it.
- `destructiveStrong` — `bg-[var(--color-error)]`, `text-white`, darker hover, focus ring
  on `--color-error`. Also no scale.

`ButtonVariant` gains both members, so every call site is type-checked.

### Call sites

The seven listed above migrate. Triggers take `destructive`; the confirm button inside a
confirmation dialog takes `destructiveStrong`. `BlogArticleEditorDeleteControls` moves from
a raw `<button>` to the atom. `DeleteUsersConfirmModal` loses its `!important` overrides.
No call site keeps a colour override; if one seems to need one, that is a finding to report
rather than a licence to add a class.

On `AcademicSectionLifecycleActions`, "Archivar sección" and "Restaurar sección" become
`ghost` and "Eliminar definitivamente" becomes `destructive`.

### Copy

Rewritten to say what the screen is for instead of where its controls are:

1. `dashboard.academicSectionPage.shellTabs.generalLead` — drop "Archivar y eliminar están
   arriba a la derecha" and the description of how cards work.
2. `dashboard.messages.lead` — drop the "(arriba a la derecha)" parenthetical. The button
   is called "Escribir mensaje"; it names itself.
3. `dashboard.adminContents.lead` — drop "más abajo".
4. `dashboard.cms.siteTheme.brandAssets.lead` — drop "en Identidad de marca más abajo".
5. `dashboard.studentEmailNotCollectedMinorLead` — drop "que figura más abajo", keeping the
   actual instruction about the tutor's phone.

Kept, because they constrain scope rather than describe layout: `dashboard.users.selfProtected`,
`dashboard.users.tipSelectAllVisible`, `dashboard.usersNav.tipList`,
`dashboard.promotions.confirmRetire`.

All five rewritten in `es`, `en` and `pt`.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **`Button`** — `destructive` renders a transparent background with an error border and
   does **not** colour its text with `--color-error`; `destructiveStrong` renders a solid
   error background; neither applies a hover-scale class; both are keyboard focusable and
   carry a focus ring.
2. **Contrast** — using `contrastRatio` from spec 3, assert white on the default
   `color.error` clears 4.5, and that the error colour is used as a border rather than as
   text in the `destructive` variant. This test is the reason the variant is shaped the way
   it is, so it should read as such.
3. **No ad-hoc destructive styling remains** — a test that greps the components listed above
   for `--color-error` combined with `text-` or `bg-`, and fails if any survives outside
   `Button.tsx`. This is what stops the pattern reappearing.
4. **Section lifecycle actions** — archive renders as `ghost`, delete as `destructive`, and
   delete is still gated by its acknowledgement checkbox. The existing confirmation
   behaviour must not regress.
5. **Copy** — the five rewritten keys contain none of "arriba a la derecha", "más abajo",
   "a la izquierda"; the four kept keys are unchanged; all three locales stay structurally
   identical.

## Done when

1. `Button` has both destructive variants and no call site styles danger by hand.
2. Nothing on the section page is visually louder than the ordinary work of the page.
3. Archive is no longer dressed as destructive.
4. No destructive control relies on error-coloured text.
5. Every existing confirmation step still works, including the delete checkbox.
6. The five strings no longer describe the layout; the four kept ones are unchanged.
7. All three locales updated.
8. No tour copy changes.

## Out of scope

- Making confirmation mechanisms consistent across the repo. The audit found four different
  patterns — modal with checkbox, `ConfirmActionModal`, a bespoke modal, and an in-page
  two-step toggle. Unifying them is a real improvement and a separate spec; this one
  changes appearance and copy, not flow.
- Giving the section hub a primary call to action. That is F13 and belongs to spec 7, which
  is reworking what these screens lead with.
- Adding a `color.error.dark` token so labels could be red and legible everywhere. Worth
  doing; it is a palette change affecting all tenants and needs its own visual QA.
- The remaining four layout-referencing strings, which are legitimate.

## Manual QA

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Open an academic section as admin. Nothing shouts. "Eliminar definitivamente" is
   outlined in red with a readable label; "Archivar sección" is quiet.
2. Delete still asks for the checkbox before enabling confirm.
3. Check the same on Mi Mundo, where the palette is warmest, and confirm the delete label
   is comfortably readable.
4. Spot-check a deletion in messages, users, blog and event attendees: all four look like
   the same kind of button now.
5. Read the section and messages leads and confirm they no longer describe the screen.
