# Cohort-scoped finance and student views — design

Date: 2026-11-06
Status: draft (waiting for approval)

## Intent

An institute runs two cohorts at the same time near the end of a year. The current cohort still collects monthly fees. The next cohort collects enrollment fees from new families.

Today the screens assume one cohort:

- Finance picks a cohort, but the year is a free number. The next cohort shows the wrong months.
- Finance treats a future year as fully due (`todayMonth: 12`). A future cohort shows every month as overdue.
- The receipt inbox mixes all cohorts and does not show the cohort.
- The student profile can add a section only in the current cohort.
- Student and family payment views list sections of every cohort in one list.

Make each view show one cohort at a time. The current cohort is the default. Staff can switch to another cohort.

## Decisions confirmed by the user

1. The default cohort is the current cohort (`academic_cohorts.is_current`).
2. The inbox default is all cohorts. Each row shows its cohort. A filter narrows the list.
3. Scope is all surfaces in one change: finance, inbox, student profile, admin student billing tab, student and family payment views.

## Out of scope

- Data model changes. Monthly payments already carry `payments.section_id`. Enrollment fees live on `section_enrollments`. Both are per section, so per cohort. No migration.
- The admin home collections widget. It stays on the current cohort.
- Registrations. It already has its own registration cohort (`registration_cohort_id`).
- Academic hub cohort pages. They are already per cohort.
- Invoices (`billing_invoices`) that have no section. They show no cohort and appear only under "All cohorts".

## Shared rule (pure)

New module `src/lib/academics/cohortScope.ts`:

- `CohortScopeOption = { id, name, isCurrent, isRegistration, archivedAt, startsOn, endsOn }`.
- `orderCohortScopeOptions(options)` — order: current, registration cohort, other active cohorts by `startsOn` descending, archived cohorts last.
- `pickDefaultCohortScope(options, requestedId)` — a valid requested id wins. Else the current cohort. Else the first active cohort. Else the first option. Else `null`. This replaces `pickFinanceHubCohort`.
- `cohortScopeYears(option, todayYear)` — the calendar years from `startsOn` to `endsOn`. Missing dates fall back to `[todayYear]`.
- `pickCohortScopeYear(option, requestedYear, today)` — a requested year inside the range wins. If today is inside the range, use today's year. If the cohort starts after today, use the first year. Else use the last year.
- `cohortScopeDueMonth(year, today)` — past year → `12`. Current year → today's month. Future year → `0` (nothing due).

The combo label for each option comes from the dictionaries. A suffix marks the current, registration, or archived cohort.

## Surfaces

### 1. Finance hub `/dashboard/admin/finance` — Tier B desktop-only (no PWA tree)

- `FinanceHubCohortSelector` becomes a client component. It shows the ordered cohorts with their suffix.
- The year becomes a select with `cohortScopeYears` only. A cohort change submits the form without the year, so the server picks the default year.
- The server clamps a requested year that is outside the cohort range.
- `loadAdminCohortCollectionsBulk` receives `todayMonth: cohortScopeDueMonth(year, today)`. A future cohort shows enrollment fees and no overdue months.
- KPI strip, Collections, and Insights follow the selected cohort, as today.

### 2. Finance inbox tab — Tier B desktop-only

- Each queue item gets `cohortId` and `cohortName`.
  - Enrollment fee: `section_enrollments → academic_sections → academic_cohorts`.
  - Monthly payment: `payments.section_id → academic_sections → academic_cohorts`. A payment with no section gets no cohort.
  - Invoice receipts: no cohort.
- A cohort filter uses the query key `inboxCohort` (the hub already uses `cohort`). The default is all cohorts.
- With a cohort filter, items with no cohort are hidden.
- Each row shows the cohort name next to the section or period.
- The hub pending counts stay global.

### 3. Student profile `/dashboard/admin/users/[userId]` — Tier B desktop-only

- `loadAdminStudentCurrentCohortAssignment` becomes `loadAdminStudentCohortAssignment(supabase, studentId, cohort)`. It takes one cohort.
- The page loads one card per cohort:
  - the current cohort;
  - the registration cohort, when it differs from the current cohort;
  - any other non-archived cohort where the student has an active enrollment (remove allowed).
- The card title is the cohort name with its suffix.
- `prepareStudentCurrentCohortSectionAdd` takes `cohortId`. It accepts only a non-archived cohort that is the current cohort, the registration cohort, or a cohort where the student already has an active enrollment. The section must belong to that cohort.
- Error code `SECTION_NOT_CURRENT` becomes `SECTION_NOT_IN_COHORT`. `NO_CURRENT_COHORT` becomes `NO_COHORT`. Update the copy.
- The add and remove actions keep their audit, schedule checks, capacity override, and `router.refresh()`.

### 4. Admin student billing tab `/dashboard/admin/users/[userId]/billing` — Tier B desktop-only

- The section cards are grouped by cohort, in `orderCohortScopeOptions` order.
- A cohort select shows one cohort at a time. The default is the current cohort when the student has a section in it. Otherwise it is the first cohort in order.
- Query key: `cohort`, through `usePersistentPageTab` rules for the URL value (`42-persistent-page-tabs.mdc`).

### 5. Student and family payment views — Tier A (Web + PWA)

Entries: `StudentPaymentsEntry`, `ParentPaymentsEntry`. PWA trees: `ParentPaymentsScreenPwa`, `StudentMonthlyPaymentsPwaAccordionList`, `MonthlyPaymentsSectionAccordion`.

- Data: each section row already has `cohortName`. Add `cohortId` and the ordering facts to the payload (`loadStudentMonthlyPaymentsView`, `loadParentPaymentsPagePayload`).
- Web (`web-desktop`): when the student has sections in two or more cohorts, show a segmented control above the section list, one segment per cohort. The current cohort is selected first. With one cohort, show no control.
- PWA (`web-mobile` / `pwa-mobile`): when there are two or more cohorts, show one heading row per cohort, current first. The next cohort group starts collapsed. Each row is a full-width touch target of at least 44px. Do not use the desktop segmented control.
- A family sees an enrollment fee for the next cohort in that cohort group. The current cohort monthly fees stay in their own group.
- Overdue signals on home (`loadStudentHomePaymentOverdueSignals`, `loadParentHomePaymentOverdueSignals`) must not count future cohort months. Verify with tests. They already count per section.

## Copy

New keys in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.

- Cohort suffixes: current, registration, archived.
- Inbox: filter label, "All cohorts", cohort column.
- Student profile: card titles and the renamed error codes.
- Payment views: cohort group label and the segmented control `aria-label`.

## Observability

- Student profile add and remove already audit. Add `cohortId` to the audit payload.
- Finance filters are read-only. No new events.
- Server failures in the new loaders use `[ge:server]` helpers with `scope` and `cohortId`.

## Risks

- `section_enrollments` and `payments` are growing tables. The inbox keeps its current limits and named columns. The cohort join uses the existing selects.
- Shared payment components serve Web and PWA. Tests must cover both trees.
- File size limit 250 lines. Split the new combo and the cohort group into their own components.

## Tests

- `cohortScope` pure tests: order, default pick, years, year pick, due month (past, current, future).
- Finance page: requested year outside the range is clamped. A future cohort uses due month `0`.
- Inbox: items carry the cohort. The filter hides other cohorts and items without a cohort.
- Student profile: two cards when the registration cohort differs. Add in the registration cohort succeeds. Add in an archived cohort fails with `NO_COHORT`. Section from another cohort fails with `SECTION_NOT_IN_COHORT`.
- Billing tab: grouping and the default cohort.
- Payment views: Web segmented control appears only with two or more cohorts. PWA groups render, current first, next collapsed. Existing `*Pwa*` and `tierADashboard*` tests stay green.

## Done when

- Each listed surface shows one cohort at a time, with the current cohort as the default.
- A future cohort shows no overdue months in finance.
- Staff can put a student in a registration cohort section from the profile.
- Families see next-cohort enrollment fees apart from current-cohort monthly fees, on Web and PWA.
- Product changelog entry added (area `finance`).

## Manual QA (user)

- Finance: switch to the next cohort and check the year and the overdue cells.
- Inbox: filter by cohort.
- Student profile: add a section in the registration cohort.
- Family view on desktop and on the installed PWA with a student in two cohorts.
