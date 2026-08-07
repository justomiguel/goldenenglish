# Parent portal — teacher feedback visibility + PWA polish

- **Date:** 2026-08-07
- **Status:** approved (user: "propone mejoras e implementa el plan, confío en ti no quiero decidir nada")
- **Scope:** `/dashboard/parent/**` (Tier A) + shared progress surface reused by `/dashboard/student/progress`

---

## 1. Understanding

- Teachers already write feedback in two places, but **parents cannot read it**:
  `enrollment_assessment_grades.teacher_feedback` (cohort rubric exams, written in the teacher
  grading matrix) is only sent by e-mail on publish, and
  `student_assessment_attempts.teacher_feedback` (learning-route attempts) is loaded by
  `loadParentLearningFeedback` but **`ParentLearningFeedbackPanel` never renders the text** — it
  prints score/diagnostic only. The "Feedback" tab is therefore a mislabeled score list.
- The same panel is mounted for **students** (`/dashboard/student/progress` reuses
  `ParentProgressEntry`), so students are equally blind to their teachers' comments.
- Discovery is broken: nothing on the parent home or the tab bar signals "there is a new comment".
- PWA baseline is solid (Serwist SW, dynamic manifest, install prompt, bottom tab bar, safe areas),
  but the parent surface still misses installed-app affordances: no pull-to-refresh (the SW sets
  `overscroll-behavior-y: contain`, so standalone users have **no way to refresh**), no manifest
  shortcut to Progress, and the feedback list is a desktop `<ul>` with no PWA tree (violates
  `05-pwa-mobile-native.mdc` Tier A).

## 2. Assumptions and open questions

| # | Assumption | Rationale |
|---|---|---|
| A1 | "Feedback" means **entries that actually carry teacher text**. Score-only rows are dropped from this surface. | Scores already live in Home (last grade), Progress → Assessments, and the pillar card. Showing them under "Feedback" is what makes the tab useless today. |
| A2 | "New" is derived from **recency (≤ 14 days)**, not a per-parent read receipt. | A read-receipt table is an auth/data contract change (needs migration + ADR + RLS) and is out of scope. Recency is deterministic, server-computed, testable, and needs **zero** migrations. |
| A3 | Only **published** cohort grades are exposed (`status = 'published'`). | Matches `loadStudentPublishedGrades`; drafts must never leak. RLS allows the read, so the app layer must filter. |
| A4 | The unified timeline is loaded **per student** (selected ward), server-side. | Today the loader fetches all wards with a global `limit(12)`, so one child can starve the other, and filtering happens in the browser. |
| A5 | Pull-to-refresh is gated to `pwa-mobile` (installed/standalone) only. | In a browser tab the platform already provides PTR; duplicating it would fight native gestures. |
| A6 | No new tables, no migrations, no RLS changes. | Every column needed already exists and is already readable by tutors via `tutor_student_rel` policies. |

Open questions — none blocking. Deliberately deferred: read receipts, push on new feedback,
parent replies to feedback (see §7).

## 3. Proposed plan

### 3.1 Domain / data (`src/lib`, `src/types`)

1. **`src/types/parentFeedback.ts`** — `ParentFeedbackSource = "assessment" | "learning"` and
   `ParentFeedbackItem { id, source, studentId, childLabel, title, contextLabel, teacherName,
   occurredOn, score, maxScore, feedback, isNew }`.
2. **`src/lib/parent/buildParentFeedbackTimeline.ts`** (pure, no Supabase/React): merge both
   sources, drop blank feedback, sort by `occurredOn` desc, bound to `limit`, stamp `isNew`,
   expose `countNewParentFeedback`.
3. **`src/lib/parent/formatParentFeedbackLabels.ts`** (pure): `Intl.DateTimeFormat` date line,
   score line, source label, meta line — shared by the desktop and PWA trees so only markup forks.
4. **`src/lib/parent/loadStudentFeedbackTimeline.ts`** (infra): bounded PostgREST reads
   (`13-postgrest-pagination-bounded-queries.mdc`) for
   `enrollment_assessment_grades` (published, non-null feedback, joined to `cohort_assessments`,
   section name + teacher name) and `student_assessment_attempts` (non-empty feedback, joined to
   `learning_assessments`), then delegates merging to the pure builder.

### 3.2 UI (Tier A → two deliberate trees)

5. **`src/components/desktop/organisms/ParentFeedbackTimelineDesktop.tsx`** — vertical timeline
   cards: source badge, "new" badge, title, section + teacher + date meta, score chip, and the
   **full feedback text** in a quoted block.
6. **`src/components/pwa/molecules/ParentFeedbackPwaRow.tsx`** — full-width, ≥44px tappable
   accordion row (`aria-expanded` / `aria-controls`), collapsed preview → expanded full text.
7. **`src/components/pwa/organisms/ParentFeedbackPwaList.tsx`** — grouped list + summary header.
8. **`src/components/parent/ParentFeedbackSurface.tsx`** — thin `SurfaceMountGate` switch only.
9. **`UnderlineTabBar`** gains an optional `badgeCount` + `badgeLabel` per item (tokens only,
   accessible name) so the Feedback tab can carry the "N new" pill.

### 3.3 Wiring

10. Parent `progress/page.tsx` and student `progress/page.tsx` both call the new loader
    (student = self; RLS already permits). `ParentProgressEntry` renders `ParentFeedbackSurface`
    and puts the new-count badge on the Feedback tab.
11. Delete the now-dead `ParentLearningFeedbackPanel`, `loadParentLearningFeedback`, and the unused
    `learningFeedback` prop path in `ParentDashboardFamilyView`.

### 3.4 Home discoverability (zero extra queries)

12. `loadChildrenSummariesForStudentIds` already selects the last published grade; add
    `teacher_feedback` to that **existing** select and expose
    `ParentChildLastGrade.hasTeacherFeedback`.
13. `ParentHomeStatusGrid` appends a "includes teacher feedback" hint to the Progress pillar detail
    when true, so the pillar links into the feedback tab with a reason to tap.

### 3.5 PWA

14. **`src/hooks/usePullToRefresh.ts`** — touch-only, top-of-scroll only, vertical-dominant,
    threshold + resistance, `prefers-reduced-motion` aware, returns `{ pull, phase, bind }`.
15. **`src/components/pwa/molecules/PwaPullToRefresh.tsx`** — indicator + wrapper; mounted in
    `ParentPwaShell` **only** when `useAppSurface() === "pwa-mobile"`; calls `router.refresh()`
    (`27-post-mutation-ui-refresh.mdc`).
16. **`src/app/manifest.ts`** — third shortcut to `/dashboard/parent/progress`.

### 3.6 Copy

17. New keys under `dashboard.parent.feedback.*`, `dashboard.parent.homeInbox.*`,
    `pwa.shortcuts.*`, `pwa.pullToRefresh.*` in `en.json` + `es.json` + `pt.json`
    (identical shape, `09-i18n-copy.mdc`).

### 3.7 Tests (TDD, self-contained)

- `buildParentFeedbackTimeline`, `formatParentFeedbackLabels`, `loadStudentFeedbackTimeline`
  (Supabase mocked at the boundary), `usePullToRefresh`.
- RTL: `ParentFeedbackTimelineDesktop`, `ParentFeedbackPwaRow`/`List`, `UnderlineTabBar` badge.
- `REGRESSION CHECK` notes on the touched summary/pillar tests.

## 4. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Draft grades leaking to parents | `.eq("status", "published")` in the loader + explicit unit test asserting drafts are excluded. |
| Student portal regression (shares `ParentProgressEntry`) | Same loader/props for both routes; student page keeps its own auth gate; RTL + existing student progress tests kept green. |
| Unbounded PostgREST reads | Per-source `.limit()` + merged `limit`, no `select("*")`. |
| Pull-to-refresh hijacking native scroll / breaking browser tabs | Only mounts on `pwa-mobile`; aborts unless `scrollY <= 0` and the gesture is vertical-dominant; passive-safe listeners; reduced-motion respected. |
| Dictionary drift across 3 locales | Same keys added to `en`/`es`/`pt` in this change; `Dictionary` type derives from `en.json` so a miss fails the build. |
| 250-line file limit (`03-architecture.mdc`) | Timeline split into type / pure builder / formatter / loader / desktop / pwa-row / pwa-list / entry switch. |

## 5. Definition of done

- [ ] A parent opening **Progress → Feedback** reads the **full text** teachers wrote, for both
      cohort rubric exams and learning-route attempts, scoped to the selected ward, newest first,
      with section, teacher, date and score context.
- [ ] Entries from the last 14 days are marked "new" and counted on the Feedback tab badge.
- [ ] Draft grades and empty-feedback rows never appear.
- [ ] Desktop and installed-PWA render **different, purpose-built trees** behind
      `SurfaceMountGate`; PWA rows are ≥44px and expandable.
- [ ] Students see the same improvement on their own progress page.
- [ ] The parent home Progress pillar hints when the latest grade carries feedback (no new query).
- [ ] Installed PWA supports pull-to-refresh and offers a Progress shortcut from the launcher.
- [ ] All user-visible copy comes from `en/es/pt` dictionaries.
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run test` pass; new logic covered by tests.

## 6. Out of scope

- Read receipts / per-parent unread state (needs migration + ADR + RLS).
- Push notification on new feedback.
- Parent → teacher replies threaded onto a feedback entry (messaging already exists separately).
- Redesign of payments, calendar, messages, or the teacher-side grading UI.
- Dark mode.

## 7. Follow-ups worth a later spec

1. `parent_feedback_reads` table for true unread state + tab-bar dot in `ParentPwaTabBar`.
2. Push notification (`pushAfterNotify`) when a teacher publishes feedback.
3. Surface `student_learning_readiness.reason` (written today, shown to nobody).
4. Background sync / SWR caching of the feedback timeline for offline reading.
