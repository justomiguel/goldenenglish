# Admin message detail — revalidate outside render

**Intent:** Opening `/[locale]/dashboard/admin/messages/[messageId]` must render. Cache refresh for the inbox list and the admin shell stays, and it runs after the response.

**Done when:**

- The detail page no longer calls `revalidateAdminInbox` during render.
- The same helper still runs after the response, via `after()` from `next/server`.
- Mark-as-read on open stays in the page (`markAdminPortalMessageRead`).
- Server actions that already call `revalidateAdminInbox` stay unchanged.

**Out of scope:** Inbox UI, read-toggle action, PWA, new copy, migrations.

## Understanding

- `AdminPortalMessageDetailPage` marks the row read, then calls `revalidateAdminInbox(locale)`.
- That helper calls `revalidatePath` for `/[locale]/dashboard/admin/messages` and the admin layout.
- Next.js 16 throws when `revalidatePath` runs with work-unit phase `render` (error code E7).
- `after()` sets that phase to `after` before the callback, then flushes pending revalidations.

## Assumptions

- The inbox refresh is still required so the list and the shell badge update on the next navigation.
- `after()` is the right place. A client round-trip is not required for this refresh.

## Plan

1. In `src/app/[locale]/dashboard/admin/messages/[messageId]/page.tsx`, wrap `revalidateAdminInbox(locale)` in `after(() => { ... })`.
2. Leave mark-as-read and the other action call sites as they are.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). Admin message detail has no `src/components/pwa/` pair. Shared hooks and actions stay the same.

## Risks

- `after()` runs only when the response finishes. A thrown render after the `after()` registration still keeps the callback. Mark-as-read already happened, so a late revalidate is safe.
- Dev strict rendering can open the page twice. Mark-as-read is idempotent (`read_at` is null). Revalidate twice is harmless.

## Definition of done

- The detail route renders for an admin session.
- The server log no longer shows E7 for `revalidatePath /es/dashboard/admin/messages` on that route.
- Manual QA (user): open a message, go back to the list, confirm the row is read and the shell badge matches.
