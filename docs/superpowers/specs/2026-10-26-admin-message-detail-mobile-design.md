# Admin message detail mobile reading, direct notification link, and read-unanswered visual state

**Date:** 2026-10-26
**Status:** Approved
**Kind:** Mini-spec

## Intent

1. Make reading a message on a phone in `/dashboard/admin/messages/[messageId]` feel native and immediate by removing nested boxes, decorative headers, and excessive vertical padding, while keeping the bottom action bar on one single row.
2. When someone sends a message from the public website contact form (`deliverPublicSiteContactToAdmins`), make the admin notification email link go directly to `/[locale]/dashboard/admin/messages/[messageId]` instead of the general mailbox list `/[locale]/dashboard/admin/messages`.
3. Make the **read but unanswered** state (`!isUnread && needsReply`) in `AdminMessageCard` visually distinct from both **unread** (`isUnread`) and **read + answered** (`!isUnread && !needsReply`).

## Context & root cause

1. **Mobile detail spacing:** On `< md`, `/dashboard/admin/messages/[messageId]` stacks `mt-7` + `space-y-8 p-4` + a 130px decorative "Message" title block + a nested bordered box (`px-6 py-8`) + wide paragraph/hr margins (`[&_p+p]:mt-5`, `[&_hr]:my-10`) + a 2–3 row wrapping fixed action bar.
2. **Email link to mailbox instead of message:** `deliverPublicSiteContactToAdmins` inserts into `portal_messages` without passing a `messageId` to `notifyPortalRecipientForStaffMessage`, which hardcodes `dashboard/admin/messages` instead of `dashboard/admin/messages/${messageId}`.
3. **Read vs unanswered visual ambiguity:** In `AdminMessageCard`, both `isUnread` and `!isUnread && needsReply` share the same primary left border (`border-l-[var(--color-primary)]`) and `bg-[var(--color-background)]`, while a read-but-unanswered row drops `fromName` to `font-normal` and `preview` to `text-[var(--color-muted-foreground)]` (identical to an already-answered row), with no "Read" indicator alongside "Needs reply".

## Done when

1. **Mobile detail (`< md`) & explicit message content block:**
   - `AdminPortalMessageDetailPage` uses tight spacing (`mt-2` below back link, `pb-4 md:pb-10`).
   - `AdminPortalMessageDetailView` shows a compact metadata header (`{fromName} → {toName} · {sentAt}` with role badge) separated by a thin border.
   - When `bodyHtmlDisplay` contains a contact-form `<hr>` separator, `AdminPortalMessageDetailView` separates the pre-`<hr>` contact metadata fields into a compact metadata block above the message section so they do not masquerade as the message body.
   - The message body section (`data-tour="admin-message-detail-body"`) always displays an explicit visible heading (`labels.detailBodyLabel`, e.g. "Mensaje completo" / "Full message") on both mobile and desktop, and wraps the message body in a distinct callout container (`border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)]/60 p-3.5 md:p-6`) with `text-base` body copy so it is immediately obvious what the message content is.
   - The bottom action bar on detail sits in normal document flow below the message card with **visible text labels on all 3 actions** (`Responder`, `Contestar con defecto`, `Eliminar`) so no button is reduced to an ambiguous icon on mobile, and `PwaPullToRefresh` omits `transform` when `offset === 0`.
   - In `AdminMessageCard` (inbox list rows), mobile (`< sm`) stacks the message link above a dedicated 2-column action bar (`flex-col sm:flex-row`) where every action (`Responder`, `Contestar con defecto`, `Marcar como leído`/`no leído`, `Eliminar`) displays both its icon and its visible text label instead of crowding 4 unlabeled icons to the right of squashed text.
   - All admin tour anchors (`messagesDetailTitle`, `messagesDetailParticipants`, `messagesDetailBody`, `messagesDetailActions`) remain mounted.
2. **Direct link in admin notification email:**
   - `deliverPublicSiteContactToAdmins` generates a deterministic `id` (`randomUUID()`) for each admin's `portal_messages` row, inserts it with `id`, and passes `messageId` to `notifyPortalRecipientForStaffMessage`.
   - `notifyPortalRecipientForStaffMessage` accepts optional `messageId?: string` and, when `recipientRole === "admin"` and `messageId` is present, builds `href` as `${origin}/${locale}/dashboard/admin/messages/${messageId}` (falling back to `dashboard/admin/messages` when `messageId` is omitted).
3. **Distinct visual state for read + unanswered (`!isUnread && needsReply`):**
   - **Unread (`isUnread: true`):** primary left border (`border-l-[3px] border-l-[var(--color-primary)]`), `bg-[var(--color-background)]`, `font-semibold` sender name, `badgeUnread` ("Sin leer" / "Unread" / "Não lida") chip (plus `badgeNeedsReply` when applicable).
   - **Read, needs reply (`!isUnread && needsReply`):** amber left border (`border-l-[3px] border-l-amber-500`), warm amber surface tint (`bg-amber-50/50`), `font-medium text-[var(--color-foreground)]` sender name (not faded out), `badgeRead` ("Leído" / "Read" / "Lida") chip paired with the amber `badgeNeedsReply` ("Sin responder" / "Needs reply" / "Sem resposta") chip, and `data-attention-state="read-needs-reply"`.
   - **Read and answered (`!isUnread && !needsReply`):** transparent left border, `bg-[var(--color-background)]`, `font-normal text-[var(--color-muted-foreground)]` sender and preview, and `data-attention-state="handled"`.
   - `badgeRead` added to `src/dictionaries/{es,en,pt}.json` under `admin.messages`.
4. **Tests:**
   - `src/__tests__/components/AdminPortalMessageDetailView.test.tsx`
   - `src/__tests__/components/AdminMessageCard.test.tsx`
   - `src/__tests__/lib/messaging/deliverPublicSiteContactToAdmins.test.ts`
   - `src/__tests__/lib/messaging/notifyMessagingEmails.test.ts`

## Out of scope

- Changes to parent, student, or teacher message threads.
- Database schema or RLS changes (`portal_messages.id` already accepts UUIDs).
- Desktop layout changes on the message detail view (`md:` and up).
