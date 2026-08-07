# Section teachers tab — richer assigned staff cards

**Date:** 2026-07-23  
**Status:** Approved — email on cards; same rich cards for assistants when present

## Intent

On the admin academic **section → Teachers** tab, the “Assigned now” summary currently shows thin name chips. Show **richer person cards** for portal staff (lead + assistants): **avatar** (or default), **key personal fields**, and a **click-through to the admin user profile**. Keep edit CTAs/modals from `2026-07-23-section-teachers-staff-modals-design.md`.

## Understanding

- Today `AcademicSectionStaffAssignedChips` renders label-only chips; page only passes `leadTeacherLabel` / `assistantChipLabels` / `externalChipLabels`.
- Staff loader (`loadAdminSectionTeachersAndAssistants`) selects `id, first_name, last_name` (+ `role` for assistants) — no avatar / phone / DNI yet.
- Avatar display already exists via `ProfileAvatar` + `resolveAvatarDisplayUrl` / `resolveAvatarUrlForAdmin`.
- Admin profile route: `/${locale}/dashboard/admin/users/${userId}` (same pattern as tutor/help search links).
- External assistants have **no** profile id — they stay non-linked summary rows.

## Assumptions

1. **Who gets a rich card:** lead teacher + portal assistants (profiles with `id`). Externals stay a compact non-clickable list (name + “External” badge).
2. **Card content (default):**
   - `ProfileAvatar` (`sm` or slightly larger) with resolved `avatarDisplayUrl` or default glyph.
   - Display name via `formatProfileSnakeSurnameFirst`.
   - Role/kind badge: Lead / Teacher / Student / Assistant (staff) — reuse existing badge copy where possible.
   - Secondary lines when non-empty: **phone**, **document** (`dni_or_passport`). Omit empty fields (no “—” clutter).
3. **Email:** optional — load via `auth.admin.getUserById` only for the **assigned** portal ids (bounded, typically ≤ ~10). Show if present; skip if missing. Prefer not to block the page if email lookup fails (log + omit).
4. **Click:** entire card (or clear name/CTA) is a `Link` to `/${locale}/dashboard/admin/users/${id}` with accessible name from dictionaries (e.g. “Open profile: {name}”).
5. **Layout:** vertical list of cards under “Assigned now”, not tiny pills — still above the three manage CTAs.
6. **No mutation contract change** — read/enrich loader + UI + i18n + tests.

## Proposed plan

| Step | Layer |
|------|--------|
| 1 | Extend loader (or sibling `loadAssignedSectionStaffSummaries`) to return assigned portal people: `{ id, label, role, phone, dniOrPassport, avatarDisplayUrl, email? }` for lead + assistants; keep external labels. |
| 2 | Replace / evolve `AcademicSectionStaffAssignedChips` → person-card list molecule (or new `AcademicSectionStaffAssignedList` + thin chip leftover for externals). Wire `locale` for profile href. |
| 3 | Dictionaries en/es/pt: open-profile aria, field labels if needed, empty state unchanged in spirit. |
| 4 | Vitest: card shows name + avatar fallback; link href; empty fields omitted; externals not linked. Loader unit test for mapping + avatar resolve mock. |
| 5 | Manual QA (user): lead with/without avatar; assistant student; click → user detail. |

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| N+1 email lookups | Only for assigned ids; parallel `Promise.all`; omit on failure. |
| PII on a busy admin screen | Only phone / DNI / email already used in admin users list; no new sensitive fields. |
| File size / architecture | Keep loader pure mapping + avatar resolve in `src/lib/academics/`; UI ≤250 LOC. |
| Tour anchors | No required anchors on chips today; update L1/L2 only if we add `data-tour`. |

## Done when

- [x] Assigned portal staff show avatar (or default), name, role badge, and available phone/DNI (and email if loaded).
- [x] Clicking a portal staff card navigates to admin user profile.
- [x] Externals remain visible without profile link.
- [x] Manage CTAs/modals still work as before.
- [x] en / es / pt + self-contained Vitest coverage.
- [ ] Manual QA (user).

## Out of scope

- Changing staff assignment/save flows or eligibility.
- Teacher portal roster UI.
- Showing full address / birth date / guardianship.
- Inline edit of personal fields from this tab.

## Decisions (approved)

1. **Email on the card:** yes when available (bounded Auth Admin lookup for assigned ids).
2. **Assistants:** same rich cards as lead when present.
