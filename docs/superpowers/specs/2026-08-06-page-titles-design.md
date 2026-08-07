# Every page says its own name in the browser tab

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 4 of 8
**Closes:** F05
**Related:** `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, every page under
`src/app/[locale]/dashboard/{parent,student,teacher,assistant}/**`

## Intent

Open four tabs of this app and they all read `Mi Mundo | Mi Mundo`. There is no way to
tell the payments tab from the messages tab, and the brand is printed twice for good
measure. Eleven of the thirteen routes the audit measured behave this way.

## Context

The duplication is not fifty pages each getting it wrong. It is one structural mistake.

`src/app/layout.tsx:50` sets:

```ts
title: { default: brand.name, template: `%s | ${brand.name}` }
```

and `src/app/[locale]/layout.tsx:61` sets **the same thing again**.

In Next.js a nested segment's `title.default` is a title like any other, so the parent
segment's template wraps it. A page that sets no title of its own falls back to the locale
layout's `default` — the brand name — which the root layout's template then renders as
`<brand> | <brand>`. Deleting `default` from the locale layout removes the second brand
from every one of those routes in a single line, because Next then walks up to the root's
`default` and uses it as-is; a segment's own template never applies to its own default.

That fixes the duplication but not the silence: the tab still says only the brand. For
that, pages have to name themselves, and today there is **no shared helper for page
metadata** — the handful of routes that do set a title each hand-roll it.

## Decisions

| Topic | Choice |
|-------|--------|
| The duplication | Drop `default` from `[locale]/layout.tsx`; keep its `template` |
| How pages name themselves | One helper, `buildPageMetadata`, used by every page |
| Where names come from | The dictionaries. New keys only where no suitable string exists |
| Which pages | The parent, student, teacher and assistant portals |
| Admin portal | Deferred to spec 5 — see below |
| Redirect-only pages | No title. They never render |
| Format | `<page name> | <brand>`, from the existing root template |

### Why the admin portal is not in this spec

Spec 5 renames and regroups the admin menu because four of its destinations are named
almost identically and a third of them sit in no group. Its titles should be the new names,
not the current ones. Titling those eighteen pages here would mean editing all of them
again next spec and shipping one release with tab names we have already decided to change.
Spec 5 applies this spec's helper as it goes.

### Where the page name comes from

A destination should have one name, so the title reuses the string already on screen: the
sidebar label for that route, or the page's own heading key. Most of these strings exist in
all three locales already, so this spec adds very little copy. Where a page genuinely has
no name anywhere — the two payment-return callbacks aside, this should be rare — a new key
is added to all three dictionaries.

## Architecture

New: `src/lib/metadata/buildPageMetadata.ts`

```ts
export async function buildPageMetadata(
  locale: string,
  pick: (dict: Dictionary) => string,
): Promise<Metadata>
```

Loads the dictionary for the locale, applies `pick`, and returns `{ title }` — a bare
string, so the root template supplies the brand. It deliberately does **not** append the
brand itself; doing that would fight the template and reintroduce the doubling this spec
exists to remove.

A page then reads:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parentNav.progress);
}
```

Pages that already hand-roll `generateMetadata` for a real title are migrated to the helper
so there is one way to do this. Pages that build richer metadata — Open Graph, a dynamic
record name — keep their own function and are left alone; the helper is for the common case.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **`buildPageMetadata`** — returns the string the selector picks, for each of `es`, `en`
   and `pt`; returns a plain string rather than an object, so the template applies; does
   not contain the brand name.
2. **The layout regression** — `[locale]/layout.tsx`'s `generateMetadata` returns a `title`
   with a `template` and **no** `default`. This is the test that pins the actual bug: it
   fails against today's code and would fail again if someone reinstated the default.
3. **Root layout unchanged** — still exports both `default` and `template`. The fallback
   has to live somewhere.
4. **Coverage of the four portals** — a test that walks
   `src/app/[locale]/dashboard/{parent,student,teacher,assistant}/**/page.tsx`, skips files
   whose default export only redirects, and asserts each remaining module exports
   `generateMetadata`. This is what stops the next new page from being silent, and it is
   why the fix is durable rather than a one-off sweep.
5. **Three sample pages** — parent progress, student calendar and teacher sections: call
   the real `generateMetadata` and assert the resulting title is the expected human name.

## Done when

1. No dashboard route renders `<brand> | <brand>`.
2. Every rendering page in the parent, student, teacher and assistant portals sets a title
   that names the page.
3. Titles are translated in all three locales.
4. There is one helper and every simple page uses it.
5. A test fails if a new page in those portals ships without a title.
6. No admin page is touched.
7. No visible copy changes on any screen — this spec only changes tab titles.

## Out of scope

- The admin portal's eighteen destinations. Spec 5.
- Public and marketing routes outside `dashboard`. Not measured in the audit.
- Making the menu label match the page heading, and breadcrumb consistency. Those are F04
  and F20, which move to spec 4b so this spec stays a mechanical, low-risk sweep.
- Open Graph and social preview titles. Untouched.

## Manual QA

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Log in as a parent and open Progreso, Pagos and Mensajes in three tabs. Each tab reads
   its own name, then the brand, once.
2. Same as a student and as a teacher.
3. Switch the interface to English and confirm the tab names are translated.
4. Open an admin page and confirm it still works, even though its tab name is unchanged.
