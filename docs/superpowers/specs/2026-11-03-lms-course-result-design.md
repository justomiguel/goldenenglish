# Course result

## Intent

The student and the family see the course result in one place. Each part keeps its own number.

## Current state

Lesson progress is `completed lessons / lessons` on the course list. Attendance percent already exists on the home hub. Task completion and assessment results already exist on other progress tabs. Nothing puts those numbers on the course.

## Decision

Show three lines on the course. Do not average them.

1. Lessons: the existing lesson percent.
2. Tasks: completed task rows for that student in the sections that grant the course, divided by assigned task rows. `RETURNED` counts as not complete, once that status exists. Before that slice, only `COMPLETED` and `COMPLETED_LATE` count.
3. Attendance: the existing attendance percent for the student. If the student has no attendance rows, the line says there is no attendance yet.

A fourth line appears only when the student has at least one assessment result. It shows the latest result title and score. It is not part of the three lines.

The continue card on the home keeps the lesson percent only.

## Done when

- The course block on student progress and parent progress shows the three lines.
- A course with 1 of 2 lessons and 0 of 2 tasks shows 50% lessons and 0% tasks.
- Missing attendance renders the empty sentence, not 0%.
- The parent sees the same numbers for the selected child.
- Copy is in `en.json`, `es.json`, and `pt.json`.

## Out of scope

- A single blended score.
- A new grade scale or a pass mark.
- Editing attendance, tasks, or assessments from this panel.

## Surfaces (Web vs PWA)

Tier A. Progress already splits in `ParentProgressEntry`.

- Web: the three lines sit under the course title in `StudentCourseList`, as a short stack of text, not three metric cards.
- PWA: the same stack is full width inside the existing progress sheet. Each line is readable without a horizontal table.
- The loader stays on the server. The list component only renders the numbers.

## Data and access

- Compute the lines in a pure function from data the progress page already loads, plus a bounded task count for the student's course sections.
- Task counts use the same student id the page already authorized. Do not scan every task in the institute.
- No new table. No ADR unless the count needs a new RPC. Prefer a filtered query with an explicit column list.

## Tests

- Pure function: lesson percent, task percent, absent attendance, and a present latest assessment.
- A returned task does not increase the task percent.
