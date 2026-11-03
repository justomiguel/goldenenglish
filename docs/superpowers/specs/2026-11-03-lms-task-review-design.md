# Task review and retry

## Intent

A student sends a short answer. The teacher writes a note and returns the task. The student edits the answer and sends it again.

## Current state

`student_task_progress.status` is `NOT_OPENED`, `OPENED`, `COMPLETED`, or `COMPLETED_LATE`. `COMPLETED` and `COMPLETED_LATE` have no exit. The student marks the task complete from `StudentLearningTaskDetail`. The teacher assigns templates from `TeacherSectionLearningTasks`. There is no answer text and no teacher note.

## Decision

Add one review cycle on the existing progress row. Do not replace the task with a new product.

States:

- `NOT_OPENED` to `OPENED` stays as it is.
- `OPENED` to `COMPLETED` or `COMPLETED_LATE` stays, and it requires a non-empty answer.
- `COMPLETED` or `COMPLETED_LATE` to `RETURNED` is a teacher action and requires a note.
- `RETURNED` to `OPENED` is the student retry. The previous answer stays visible until the student sends a new one.
- A later completion uses the same due-date rule as today.

Storage:

- `student_task_submissions`: progress id, author id, body text, created at. Append only.
- `student_task_reviews`: progress id, author id, body text, created at. Append only.
- The progress row keeps the status and the timestamps. The latest submission and the latest review are what the screen shows.
- Body text is plain text, trimmed, 1 to 4000 characters. Persist it as text. Do not store HTML.

Access:

- The enrolled student inserts a submission and moves `RETURNED` to `OPENED`, then completes again.
- A teacher who can already manage that section inserts a review and moves a completed status to `RETURNED`.
- The parent of that student can read the status, the latest answer, and the latest note. The parent cannot write.
- `recordSystemAudit` stores the return with actor, task id, and student id. The note text stays out of the audit payload.
- The student `action` event records `task_submitted` and `task_resubmitted` as entity metadata on the existing action type.

## Done when

- A student cannot complete an opened task with an empty answer.
- A teacher cannot return a task without a note.
- After return, the student sees the note, edits the answer, and can complete again.
- A parent sees the note and cannot submit.
- A second return keeps both notes in order. The screen shows the latest note and can reveal the older ones.
- Spanish, English, and Portuguese copy covers the answer field, the return action, and the note.

## Out of scope

- File or photo submission.
- A numeric grade on the task.
- Peer review.
- Editing another student's answer.

## Surfaces (Web vs PWA)

Student and parent are Tier A. Teacher is Tier B.

- Student web: the answer field and the note sit on `StudentLearningTaskDetail`, under the task body.
- Student PWA: the same detail stays inside `StudentLearningTasksEntry`. The field is full width. The submit control is at least 44px and sits at the bottom of the article.
- Parent web and PWA: `ParentTaskDetailScreen` shows the answer and the note as read-only text, plus the existing read-only notice.
- Teacher: add the return control on the desktop task screen. No PWA tree. The note uses a text area, not `prompt`.

## Data and access

- Migration adds `RETURNED` to `task_progress_status` and the two append-only tables, with RLS.
- Update the completion check so `RETURNED` has no `completed_at` requirement beyond the existing open shape. Set `completed_at` back to null when the teacher returns the task. Keep history in the submission and review tables.
- ADR required for the new status and the cross-account teacher write.
- Log denied writes with `[ge:server]` and scope `learningTasks.review`.

## Tests

- Pure transition table: the four new edges pass, and a student cannot move `COMPLETED` to `RETURNED`.
- Empty and oversized text fail before a write.
- A parent session cannot insert a review or a submission.
