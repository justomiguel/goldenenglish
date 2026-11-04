# Free course E2E

**Intent:** One Playwright spec proves an adult student can enroll in a free published course and see it on the progress screen.

**Done when:**

- The isolated seed turns `merch_enabled` on and upserts course `E2E Free Course` (`slug` `e2e-free-course`, `status` `published`, `price` 0, `listed_in_shop` true).
- `e2e/critical-free-course.spec.ts` runs in a new `chromium-critical-course` project that depends on auth setup.
- The seeded student opens `/tienda/curso/e2e-free-course`, submits **Inscribirme**, and the progress screen shows the course title.
- A second run still passes. The grant upsert does not create a second row.

**Out of scope:**

- A paid course, Flow, or Mercado Pago.
- A parent enrolling a child.
- Lesson completion and certificates.

## Surfaces (Web vs PWA)

- The public course page and student progress are Tier A. This spec uses Desktop Chrome.
- Progress renders through `ParentProgressEntry` on both surfaces. This change does not alter that component, its props, or the PWA tree.
