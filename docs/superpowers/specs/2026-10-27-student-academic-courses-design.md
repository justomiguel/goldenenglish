# Student academic tab — courses and teachers

## Intent

On an admin user profile, when the person is a student enrolled in one or more courses, the Academic tab lists each course and the teachers of that course.

## Done when

- Each current-cohort section shows the section name, the lead teacher, and any assistants.
- The section name opens the section. Each teacher name opens that profile.
- A section with no lead teacher shows the empty value.
- A student with no current sections still sees the existing empty state.
- The Academic tab does not show a standalone “Assigned teacher” row.

## Out of scope

- Courses outside the current cohort.
- Teacher, parent, and admin profiles.
- Deleting `profiles.assigned_teacher_id`.
