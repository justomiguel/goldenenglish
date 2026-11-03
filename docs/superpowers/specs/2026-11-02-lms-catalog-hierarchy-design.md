# LMS catalog hierarchy

**Intent:** Store courses, pieces, and learning routes the way Moodle and Canvas do. A section assigns a route or a course. A route is a set of courses. A course is modules of items. An item points at one piece in the bank. The institute groups courses with one category tree, free hashtags, and its own fields.

**Done when:**

- An admin can create a category, with an optional parent.
- An admin can create a course in one category, with hashtags, modules, and lessons that point at repository pieces.
- An admin can add a course field of type text, list, checkbox, or date, and fill it when creating a course.
- An admin can create a route made of course sets. A set completes as all in order, all in any order, or at least N courses.
- An admin can assign that route to a section. A student in that section can see those courses.
- The course list filters by category. The repository list filters by hashtag and by material type (video, PDF, quiz, image, audio).
- The teacher master-class library filters by the same hashtag and material type.
- Existing `learning_routes` rows stay. This change does not drop them.

**Out of scope:**

- Score-based paths (Canvas Mastery Paths).
- Competency frameworks and learning plans.
- Nested route sets in the form. The table allows a parent set. The first form creates top-level sets only.
- Hashtag search inside the route graph canvas.
- A shop change. Category and hashtags do not change the public shop card yet.

## Surfaces (Web vs PWA)

Tier B. Admin contents and the teacher task library have no PWA tree. The forms stay desktop, with a 44px target on the new controls. Student course visibility uses the existing progress path. This change does not add a new student screen and does not change a shared PWA prop.

## Domain

```text
Section
├── Route
│   └── Set  (all in order | any order | at least N)
│       └── Course
│           └── Module
│               └── Item → Piece
└── Course
```

- A course has one category or none. None is shown as General.
- A course has many hashtags. A hashtag is a short token, stored without `#`.
- Institute fields belong to the course. A list field has options.
- A piece stays in `content_templates`. A lesson stores `content_template_id`.
- Progress stays on `course_lesson_progress`. Route progress is the completion of its courses.

## Decisions

- Copy Moodle Workplace for the route: sets of courses, not a graph of pieces.
- Copy Moodle for the category tree and course custom fields.
- Copy Canvas Catalog for free hashtags.
- Add tables. Do not rewrite `learning_routes` in this change.
- `course_visible_to_user` also returns true when the course sits in a route assigned to the student's section.
