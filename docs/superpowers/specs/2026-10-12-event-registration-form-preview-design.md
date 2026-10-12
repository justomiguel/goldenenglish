# Event registration form preview

**Intent:** On the event form tab, a button opens the registration form as the public page would show it, including while the event is still a draft.

**Done when:**

- The form tab has an always-visible button, with a leading icon, that opens an admin-only preview.
- The preview renders the same registration form used on the public page: shared questions, the flow question when there are two or more flows, and only the fields of the chosen flow.
- A draft event can be previewed. The public `/events/{slug}/register` page still returns not found until the event is published.
- The preview does not create an attendee. The submit control is disabled, and a short banner says this is a preview of the saved form.
- Only an admin session can open the preview. Anyone else does not see the draft form.
- Visible copy is in `en.json`, `es.json`, and `pt.json`.

**Out of scope:**

- Preview of edits that have not been saved yet.
- Sending a test registration from the preview.
- A public or shareable preview link.
