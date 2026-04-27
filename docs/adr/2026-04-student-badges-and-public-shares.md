# ADR: Student badge grants and public share pages

## Context

Students need visible milestones (tasks, attendance, profile, assessments) and a way to share a single achievement outside the app (e.g. WhatsApp) with a rich link preview, without exposing the whole profile or unguessable PII in URLs.

## Decision

- Persist one row per `(student, badge_code)` in `public.student_badge_grants` with a unique `public_share_token` (UUID) per row. Inserts are performed only from trusted server code using the service role, not from authenticated RLS.
- RLS: students may `SELECT` only their own rows. No insert/update for `authenticated` on this table.
- Unauthenticated and crawler reads for a share use the SQL RPC `public.get_public_student_badge_share(p_token uuid)` (`SECURITY DEFINER`) returning only `badge_code` and `earned_at`. No PII. `EXECUTE` granted to `anon` and `authenticated`.
- Public route `/[locale]/b/[token]` (plus `opengraph-image.tsx` in the same segment) serves HTML for humans and Open Graph for messengers, with `robots: { index: false, follow: false }`.
- Analytics: trusted insert into `user_events` for the student on earn via the service role (`recordStudentBadgeEarnedEvent`), with entity `section:student_badges`.

## Options considered

- Storing public HTML snapshots in storage — rejected: harder to version and to align with the design system; OG image generation in-app is enough for previews.
- Relying on `recordUserEventServer` from staff session — rejected: it only accepts events when the session user matches the subject, so the service-role helper is used for system-triggered grants.

## Consequences

- WhatsApp and similar scrapers that respect OG will show the localised title/date image; the underlying grant remains tied to a random token and does not need the user’s name in metadata.
- Students who attend less than one day per week may take longer to achieve the `attendance_streak_5` badge, which is defined as **five consecutive calendar days** with at least one `present`/`late`/`excused` mark. This can be revisited if product prefers “sessions in a row” for sparse schedules.
- Migrations: `supabase/migrations/078_student_badges.sql` and `masterdb.sql` context update.

## Tests

- `src/__tests__/lib/badges/attendanceStreak.test.ts` — pure streak.
- `src/__tests__/lib/badges/badgeEligibility.test.ts` — rules per badge.
