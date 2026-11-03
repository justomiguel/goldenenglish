# Student LMS continue card

## Intent

Show the student where to continue a course. Open the next lesson. Show course progress. Give a printable proof when every lesson is complete.

## Done when

- The student home shows one continue card when the student has a published course.
- The card names the course, the percent complete, and the next open lesson.
- The next lesson page shows the lesson title and the lesson text when the lesson is unlocked.
- A locked lesson stays closed and does not show the text.
- The course list shows the same percent.
- A finished course links to a certificate page the student can print.
- Spanish, English, and Portuguese copy live in the dictionaries.

## Out of scope

- A new plan cap or a price change.
- Forums, SCORM, or a campus.
- A blended grade that mixes tasks, quizzes, and attendance.
- Teacher return and student retry on learning tasks. That status does not exist yet.
- A new announcement table. The home news feed stays the section notice.

## Surfaces (Web vs PWA)

Tier A. The student home uses `ParentDashboardEntry`, which already splits desktop and PWA.

- Web: the continue card sits under the greeting inside `ParentHomeInbox`.
- PWA: the same card sits under the greeting inside `ParentHomePwaFocus`.
- The lesson page and the certificate page are one readable column on both surfaces. Touch targets stay at least 44px.

## Decision

Progress stays `completed lessons / lessons`. The continue target is the first unlocked lesson that is not complete. If every lesson is complete, the card points at the certificate.
