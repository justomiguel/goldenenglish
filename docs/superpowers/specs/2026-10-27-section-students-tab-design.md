# Section area opens on click

**Intent:** On an admin section, a hub card (Students and the other areas) opens that area in the same view. The URL gains `?tab=`. The page does not wait for a server reload.

**Done when:**

- A click on Students shows the students panel in the same turn.
- The address bar updates to `?tab=students`.
- Back returns to the section hub.
- Fees, teachers, attendance, and the other hub cards use the same path.
- `router.push` and `router.replace` stay unused for this switch.
- A direct load of `?tab=students` still opens Students.

**Out of scope:**

- Changing section data loading.
- New copy.
- The admin directory `/students` route.
