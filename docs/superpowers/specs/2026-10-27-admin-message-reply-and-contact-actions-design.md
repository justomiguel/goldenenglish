# Admin message reply and contact actions

**Intent:** On the admin messages inbox and on the detail, show what happened to the inbound message. Show who did it. On the detail, add mail and WhatsApp actions that open a predefined message, and record those opens.

**Done when:**

- Every inbound card and the detail show one status stack. Use only the lines that are true:
  - Unread, when `read_at` is empty.
  - Read only, when `read_at` is set and no reply and no follow-up exist.
  - Replied in the portal: replier name (surname first), time, and the reply text.
  - Replied by email: the admin who sent the visitor email, time, and that sent text. This is the mail the app sends. It is not a Gmail click.
  - Opened WhatsApp, opened mail, opened Gmail, or opened Outlook: actor name and time. The label says opened. It does not say the outside app delivered the message.
- A card with no reply and no follow-up does not invent a reply line.
- The detail page shows the same stack, with the reply text under the matching line.
- The detail action row adds **Open mail**, **Gmail**, and **Outlook** when a recipient email exists.
- Those three links use the same To, subject, and body.
- The body is the existing default reply template (`resolveMessagingDefaultReplyTemplate`).
- **WhatsApp** appears only when a phone resolves. It opens `https://wa.me/{digits}?text=…` with the same body.
- A missing email hides the three mail actions. A missing phone hides WhatsApp.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- Vitest covers the status stack, reply matching, phone and email resolution, and the link builders.

**Out of scope:**

- Action buttons on the inbox list. List actions stay off.
- A mail-client picker. Gmail and Outlook are two separate links.
- Brand SVG logos. Lucide `Mail` and `MessageCircle` plus the visible label.
- Storing a new phone column. Contact-form phone stays inside the message HTML.
- Sending WhatsApp, Gmail, or Outlook from the server. Those links only open the other app.
- A second confirm step (“I sent it”). The recorded fact is the open.

## Where it shows

| Surface | Status stack | Mail / WhatsApp buttons |
| --- | --- | --- |
| Inbox card | Under the original preview. Snippet only, 120 characters. | No |
| Sent list | No | No |
| Detail | Same stack, full reply text | Yes, in the existing action row |

Example, when all of these happened: “Read only” is omitted. The card lists “Replied by email · Pérez · snippet”, then “Opened WhatsApp · Gómez · time”.

## What happened

Build the stack in this order. Skip a line when its fact is missing.

| Line | Fact | Wording idea |
| --- | --- | --- |
| Unread | `read_at` is null | Unread |
| Read only | `read_at` is set, and the rows below are empty | Read only |
| Portal reply | Latest later portal answer | Replied in the portal · {name} |
| Email reply | App sent the visitor email (`external_replied_at` plus the sent copy row) | Replied by email · {name} |
| Follow-up | One row per open, newest last | Opened WhatsApp · {name} / Opened Gmail · {name} / Opened Outlook · {name} / Opened mail · {name} |

`needsReply` is false when any portal reply, email reply, or follow-up exists. Unread can still be true until someone opens the detail.

## Follow-up log

New table `portal_message_follow_ups` (additive migration, admin RLS):

- `id`, `message_id`, `actor_id`, `channel` (`whatsapp`, `mailto`, `gmail`, `outlook`), `created_at`
- The detail click calls a server action that inserts the row, then the browser opens the link.
- Portal replies and sent visitor emails stay in `portal_messages`. Do not copy them into this table.

ADR: `docs/adr/2026-10-27-portal-message-follow-ups.md` before the migration ships.

## Which reply

Use the latest `portal_messages` row that is a later answer to this inbound message.

- Portal peer (student, parent, teacher): `recipient_id` is the inbound sender, `created_at` is later, and the sender role is `admin` or `teacher`.
- Site contact: same, and `external_contact_reply_email` equals the visitor email on the inbound row.
- The replier name is that row’s sender, surname first.
- The snippet is plain text from `body_html` (same preview helper, 120 characters on the card). The detail shows the sanitized reply HTML.

The inbox may match only inside the rows already loaded (the current 500-row window), same as `needsReply`. The detail runs one bounded lookup (newest matching row, `limit 1`) so the reply still shows if it is outside that window.

## Contact targets

| Kind | Email | Phone |
| --- | --- | --- |
| Site contact | `external_contact_reply_email` | First phone-like value in the contact meta block (text before the first `<hr>`), via `resolveWhatsAppDigits` |
| Portal peer | Auth email of the inbound sender (`getUserById` on the detail only) | `profiles.phone` of the inbound sender |

Do not call `getUserById` once per inbox row.

## Links

Pure builders. No React.

- Mail: `mailto:{email}?subject=&body=`
- Gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=&su=&body=`
- Outlook: `https://outlook.office.com/mail/deeplink/compose?to=&subject=&body=`
- WhatsApp: `https://wa.me/{digits}?text=`

Web links open in a new tab with `rel="noopener noreferrer"`. `mailto` stays in the same tab.

Subject is a dictionary string: `Re: {name}`. The name is the inbound sender display name.

## Analytics

On click, `trackEvent` with `event_type` `click`, entity `message`, and metadata `{ channel: "mailto" | "gmail" | "outlook" | "whatsapp", messageId }`. No email, phone, or body in metadata.

## Layers

- Pure match + URL builders: `src/lib/messaging/`
- Loaders: `loadAdminPortalMessagesMailbox.ts`, `loadAdminPortalMessageDetail.ts`
- UI: `AdminMessageCard.tsx`, `AdminPortalMessageDetailView.tsx`, detail page actions
- Dictionaries: `en.json`, `es.json`, `pt.json`
- Changelog entry when the UI ships
