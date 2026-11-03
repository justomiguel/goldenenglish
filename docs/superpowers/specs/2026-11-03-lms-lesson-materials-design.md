# Lesson materials

## Intent

An unlocked lesson shows the material that staff already stored on its content template. A locked lesson shows none of that material.

## Current state

`course_lessons.content_template_id` points at `content_templates`. A template has sanitized HTML, `content_template_assets` (`file` or `embed`), and `content_template_blocks` (`text`, `file`, `video_embed`, `audio`, `image`, `pdf`, `quiz`, `external_link`, `divider`).

Students can read the lesson row. They cannot read `content_templates` under RLS. The lesson page currently loads the template with the admin client and shows plain text only. Task detail already renders a YouTube or Vimeo iframe. PDF and file assets on a task render the label only.

## Decision

Keep the template as the source. Do not copy assets onto the lesson.

1. Resolve the lesson with the student session and `loadStudentCourses`.
2. If the lesson is missing, return not found.
3. If the lesson is locked, render the lock sentence. Do not read the template. Do not create a signed URL.
4. If the lesson is unlocked, read that one template on the server and return a bounded view model.
5. Render blocks in `sort_order`. When the template has no blocks, render the body and then the assets.
6. Sanitize HTML with the existing message sanitizer before render.
7. An embed renders an iframe only when `src/lib/learning-tasks/assets.ts` accepts the URL as YouTube or Vimeo.
8. A file, PDF, audio, or image gets a short-lived signed URL after the unlock check. The response cache is private.
9. An external link renders only for `http` and `https`.
10. A quiz block does not create a second quiz engine. If its payload points at an assessment the student can already open, link there. Otherwise show the quiz prompt as text and do not score it.

## Done when

- An unlocked lesson shows text, an allowed video, and a file link for a template that has those blocks.
- A locked lesson shows the lock sentence and no media URL in the HTML.
- A rejected embed URL does not become an iframe.
- A student cannot request a signed URL for a template that is not on an unlocked lesson.
- Copy for the empty material state is in `en.json`, `es.json`, and `pt.json`.
- Opening an unlocked lesson records an existing `action` event with entity `course_lesson` and the lesson id. No new event type.

## Out of scope

- A new authoring screen. Staff keep editing templates where they do today.
- SCORM, file upload by the student, and a new quiz runner.
- Changing who may edit a template.

## Surfaces (Web vs PWA)

Tier A. The student task screen already splits in `StudentLearningTasksEntry`.

- Web: one column, max width aligned with the task detail. Video uses a 16:9 frame. The file link is a text link with a leading icon.
- PWA: wrap the lesson page in `PwaPageShell` through the same entry pattern. The video frame is full width. File and back links are at least 44px tall. Safe areas stay on the shell.
- Shared data loader. Do not fetch the template in the client.

## Data and access

- Read the template only after the unlock check.
- Signed URLs expire within the same window the app already uses for private files.
- Log a failed template read with `[ge:server]` and scope `courses.lessonMaterials`.
- An ADR records the server read of one unlocked template, because the student RLS policy does not grant that table.

## Tests

- Pure filter: locked lesson yields no blocks and no URLs.
- Pure allowlist: a Vimeo URL stays, any other host is dropped.
- Loader test with a fake client: the template query runs only when the lesson is unlocked.
