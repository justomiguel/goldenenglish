# Admin messages inbox: visitor name, source icon, row gap, counters

**Intent:** In the admin messages **Received** list, show the **person who wrote** (visitor name for contact-form mail, not the synthetic “Website contact” profile), mark **contact form vs internal** with a distinct icon, add **space between rows**, and show **summary counters** (received, unread, needs reply — and sent when on Sent).

**Done when:**

1. **Contact-form `fromName`** is the visitor’s display name (from the public form), not the synthetic `site_contact` profile label. Legacy rows without a stored name fall back to a pure HTML/header parse when possible, else a dictionary-backed fallback (not the role chip alone as the primary name).
2. Each row exposes a **source** signal: `contact_form` | `internal` (portal peer). UI shows a Lucide icon + dictionary `aria-label` / title (e.g. Globe/Mail vs MessagesSquare); role chip may stay but must not be the only distinction.
3. List rows have **visible vertical gap** between items (not only a hairline divider inside a flush stack).
4. Above the active folder list (or in the tab chrome), **counters** for the current data set:
   - Inbox: total received, unread, needs reply (and optionally “handled” = total − attention).
   - Sent: total sent (unread/needsReply stay N/A / zero).
   - Counts derived from loaded mailbox rows (same 500 window as today); copy via en/es/pt dictionaries; `Intl.NumberFormat` for numbers.
5. Vitest: name resolution helper + mailbox row fields; RTL smoke for icon + counters + spacing class; no brand literals.
6. If a new column is added for visitor name: additive migration + short ADR note (or extend existing attention ADR).

**Out of scope:**

- Real-time live counters / websockets.
- Collapsing broadcast copies into one shared unread count across admins.
- Parent/student/teacher mailbox redesign.
- Changing compose or detail layouts beyond sharing `fromName` / source for consistency on detail if cheap.

## Understanding

- Contact submissions use `PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID`; `fromName` today is that profile’s name → reads as website contact / site form.
- Visitor **full name** is already known at insert (`senderDisplayName` / metaLines) but only lives in HTML + notify payload, not a dedicated list field.
- Dense list already has unread / needs-reply; missing source icon, row gap, and summary counts.

## Assumptions (defaults if you approve without changes)

1. **Persist** `external_contact_display_name TEXT NULL` on insert (alongside existing `external_contact_reply_email`); mailbox prefers that column, then HTML extract, then dict fallback.
2. Counters sit **under the folder hint**, above the list, as a compact horizontal summary (icons optional, text + numbers required).
3. Row gap: ~`space-y-2` / separate bordered rows rather than a single flush `divide-y` table.
4. Icons: **Globe** (or **Mail**) for contact form; **MessageSquare** for internal portal messages.

## Risks

| Risk | Mitigation |
|------|------------|
| Locale-specific meta labels break HTML name extract | Prefer stored column for new rows; extract only as legacy fallback |
| Counters confuse with “all-time” totals | Copy clarifies “in this list” / recent window if needed |
| Icon-only source fails a11y | Dictionary `aria-label` + visible text optional sr-only |

## Manual QA (user)

- New contact form submission shows visitor name in Received, with contact-form icon.
- Internal student/parent/teacher/admin mail shows person name + internal icon.
- Gaps between rows; counters update when filters change (if filters narrow the set).

## Open questions

None blocking — defaults above apply on “OK”.
