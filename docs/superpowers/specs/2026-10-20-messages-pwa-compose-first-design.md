# Phone messages — write first

**Date:** 2026-10-20
**Status:** Approved
**Kind:** Mini-spec

## Intent

On a phone, a messages screen exists so the person can write. The history is a short thread. It is not a stack of cards above the writer.

## Done when

1. On `web-mobile` and `pwa-mobile`, the parent, student, and teacher message screens show the composer on the screen. The composer sits at the bottom, above the safe area. A floating button is not the only way to write.
2. Each past message is one bubble. It shows who, when, and the body. It does not use a full bordered card, a feed heading, or a page hero above the thread.
3. A reply uses that same bottom composer. The recipient is already chosen. The person does not open a second card stack to answer.
4. On the admin message detail, a phone shows one line: from, to, and time. The body comes next. Reply, reply with the template, and delete sit in one bar at the bottom. The two participant cards stay on `md` and wider.
5. On the admin mailbox, the four counts sit in one horizontal row below `sm`. They do not stack in a single column. From `sm` up, the grid stays two columns, then four. On a phone the title drops the lead, each message is one row, and the list is not wrapped in a second card. The default-message editor stays off the phone and returns from `md`.
6. Desktop (`md` and wider) keeps the current cards, headers, and compose blocks.
7. Tour anchors on the admin detail stay mounted: `messagesDetailTitle`, `messagesDetailParticipants`, `messagesDetailBody`, `messagesDetailActions`.
8. New or changed copy is in `en.json`, `es.json`, and `pt.json`. Spanish uses tuteo.

## Out of scope

- Inbox filters, bulk select, and the admin mailbox list.
- A new rich-text editor.
- Desktop layout changes.
- SQL, RLS, or send/reply server actions.

## Behavior

- Parent phone client renders `ParentMessagesComposeForm` or `ParentMessageReplyForm` in a bottom bar. The feed uses a `thread` layout.
- Student and teacher phone layouts use the same thread and a bottom composer. Wide layout stays a form card plus message cards.
- Admin detail hides the two participant panels below `md` and shows the one-line meta instead. The action row is fixed on small screens and in normal flow from `md` up.

## Tests

- Parent phone client shows the compose fields without opening a modal.
- Admin detail still exposes the participant tour anchor, and the compact meta line is in the document.
