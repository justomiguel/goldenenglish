# Section notice

## Intent

A teacher publishes a short notice for one section. Enrolled students and their families see it on the home. The institute blog and the message inbox stay unchanged.

## Current state

`loadParentHomeNewsFeed` merges published blog posts and upcoming institute events. It is not a note from the teacher. Messaging is a separate inbox.

## Decision

Add `section_notices`.

- Columns: id, section id, author id, body text, published at, archived at.
- Body text is plain text, trimmed, 1 to 500 characters.
- One section shows at most five active notices, newest first.
- Archive hides a notice. Do not delete the row.
- The teacher who can manage the section, and an admin, can create and archive.
- A student reads active notices for sections where that student is enrolled.
- A parent reads active notices for sections where a linked child is enrolled.
- The home renders a notice block above the blog and event feed. The feed component stays as it is.

## Done when

- A teacher can publish and archive a notice from the section screen.
- An enrolled student sees the notice on the student home.
- The parent of that student sees it on the parent home.
- A student from another section does not see it.
- An archived notice disappears from both homes.
- Copy is in `en.json`, `es.json`, and `pt.json`.
- Publishing records `recordSystemAudit` with the notice id and the section id. The body stays out of the payload.

## Out of scope

- Comments on a notice.
- Push notification delivery.
- Attachments.
- A notice for every section at once.

## Surfaces (Web vs PWA)

Tier A for reading. Tier B for writing.

- Student web: the block sits under the greeting and above the status grid in `ParentHomeInbox`, after the continue card when that card exists.
- Student PWA: the same block sits in `ParentHomePwaFocus` in that same order. The text wraps. No carousel.
- Parent web and PWA: the same placement on the parent home.
- Teacher: a text area and an archive control on the desktop section screen. Confirm archive with the existing confirm modal, not `window.confirm`.

## Data and access

- Migration adds the table, RLS, and an index on `(section_id, published_at)` for active rows.
- ADR required for the new read policy across student and parent.
- The home query filters by the viewer's section ids and `archived_at is null`, orders by `published_at desc`, and limits to five per section. Chunk the section id list if it can exceed the existing `.in()` batch size.
- Log a failed insert with `[ge:server]` and scope `sectionNotices.publish`.

## Tests

- Pure selector: five newest active notices, archived rows removed, other sections removed.
- A parent id that is not linked to the section gets an empty list.
