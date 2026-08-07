# Admin messages inbox: redesign unread, mark unread, larger stats

**Intent:** Reimagine the admin **Messages** Received/Sent screen so unread mail is clearer and less noisy, staff can **mark a message unread again**, and folder **statistics** use larger, scannable numbers—while keeping visitor name, source icon, row gap, and attention sort from prior work.

**Done when:**

1. **Unread visual** — Unread rows no longer rely on the current muted wash + tiny primary left bar + small dot as the main signal. New treatment (defaults below) is calmer and clearer at a glance, AA contrast (**`26`**), not color-alone (weight + label/icon).
2. **Mark unread** — From the list row (and optionally detail), a control sets `read_at = NULL` for that admin’s copy. Server action + `revalidatePath` + `router.refresh()` (**`27`**). Only recipient/admin per existing attention RLS. Idempotent.
3. **Mark read (optional toggle)** — Same control can mark read without opening detail when already unread (Mail / MailOpen pattern), so the row is self-sufficient.
4. **Stats** — Counts render as **metric tiles**: large numeral (`text-2xl` / `text-3xl` tabular), short dictionary label underneath; Received / Unread / Needs reply (Sent: one tile). Not a single inline “Received: 3” sentence string.
5. **Layout reimagine** — Cleaner chrome: stats strip under tabs; list without heavy nested gray box if possible; row hierarchy: source icon · **from name** · preview · date; actions (reply, unread toggle, delete) grouped trailing. Keep dense but breathable (`space-y-2`+).
6. Vitest for mark-unread helper/action path + RTL for unread styling hooks (`data-unread`) + counts tiles; en/es/pt copy for toggle aria/labels.
7. No new migration if `read_at` already nullable and UPDATE policy allows clearing it (verify trigger still allows only attention columns — clearing `read_at` is an attention update).

**Out of scope:**

- Bulk select / “mark all read”.
- Real-time websockets.
- Parent/student mailboxes.
- Changing needs-reply business rules.

## Understanding

- Unread today: left accent + muted background + small dot + semibold — feels muddy / “dirty” rather than crisp.
- `markAdminPortalMessageRead` only sets `read_at` when null; no clear-unread path.
- Stats are small inline text lines.

## Design decision (defaults on OK)

| Element | Choice |
|---------|--------|
| Unread row | White/surface row; **semibold from-name**; visible **“Unread”** chip (dict); **no** full-row muted wash; optional thin primary left bar only when unread **or** needs-reply (not both competing washes) |
| Read row | Slightly quieter type (`font-normal`), no Unread chip |
| Needs reply | Keep existing chip; independent of unread |
| Stats | 3 tiles in a row (gap); number dominant, label secondary |
| Mark unread | Trailing icon button `Mail` / `MailOpen` with dictionary `aria-label`; on success refresh list |

## Risks

| Risk | Mitigation |
|------|------------|
| Accidental mark-unread | Explicit control, not hover-only; refresh counters |
| Trigger blocks clearing `read_at` | Confirm 167 trigger allows attention column changes including NULL |
| Nested boxes + tiles clutter | Drop inner muted panel; one surface for list |

## Manual QA (user)

- Unread looks distinct without feeling “highlighted dirty.”
- Toggle unread ↔ read on a row; counters update after refresh.
- Stats numbers clearly larger than before.

## Open questions

None blocking — defaults above apply on “OK”.
