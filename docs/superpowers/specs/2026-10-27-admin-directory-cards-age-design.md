# Admin directory cards, billing legend, and age filter

**Intent:** Staff can scan student, parent, and user rows without a cramped layout. The Sí / No mark has a legend. A click on a person shows that the profile is opening. Student and parent lists can filter by age.

**Done when:**

- Desktop rows and mobile cards use more padding and a larger gap, so names and marks are not stacked tight.
- Above the student and parent lists, a short legend says what Sí, No, and — mean for the month fee.
- Action icons (view, edit, delete) are smaller. The hit area stays at least 36px on desktop and 44px on mobile.
- A click on the name or the card shows a busy state on that row until the profile route opens.
- Student and parent filter panels include Edad. Bands are: sin fecha, 0–2, 3–5, 6–8, 9–12, 13–17, 18+. Each option shows a count, same as the other filters.
- Age uses `profiles.age_years` for the person on that row. A parent filter uses the parent's age, not a child's age.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- The users list (all roles) gets the same spacing, smaller icons, and click busy state. It does not gain the age filter, because that list has no directory filter panel. The legend appears only where Sí / No marks are shown.
- Filter and sort are separate controls. A filter change does not change the sort.
- Sort is an ordered list of criteria, in priority order. The first row leads. A tie uses the next row. The first row’s field can be any column, including one that is not the name.
- Each row has one arrow on the same line. The arrow points up or down and flips that row’s direction. The staff member can move a row up or down, add a row, or remove a row.
- The list shows a busy state while a new filter or sort loads.
- Column header click adds that column to the checklist, or flips its direction when it is already there.

**Out of scope:**

- A new card grid that replaces the desktop table.
- Filtering parents by a child's age.
- Changing how “al día” is calculated.
- Teacher-only age bands beyond the shared filter keys if teachers do not show the billing marks. Teachers do not get the age filter in this change.
