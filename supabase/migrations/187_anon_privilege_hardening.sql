-- Take write privileges away from the anonymous role, and stop new tables from being
-- born with them.
--
-- CANONICAL WARNING FOR EVERY FUTURE MIGRATION: never repeat migration 166 line 12 —
-- `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated` — and never restore
-- ALL in the default privileges. That single statement silently undoes this whole file,
-- plus the REVOKEs in 180, 181 and 182, without touching RLS, so nothing looks broken
-- afterwards. If a new table needs anonymous access, grant it on that table by name, the
-- way `registrations` is granted below.
--
-- What 166 left behind, measured on a local database before this migration: `anon` held
-- DELETE, INSERT, UPDATE, TRUNCATE, TRIGGER and REFERENCES on 83-85 tables of `public`.
-- RLS gates SELECT/INSERT/UPDATE/DELETE, so those were contained in practice, but
-- TRUNCATE is not gated by row security at all — no policy can stop it, and no policy
-- could have. PostgREST does not expose TRUNCATE, so there is no known route from the
-- public API; the privilege is removed because it has no legitimate purpose, not because
-- an exploit is known.
--
-- SELECT is deliberately untouched. site_settings, site_themes, site_theme_media,
-- blog_articles, blog_article_translations, events, event_translations,
-- event_form_fields, badge_catalog, badge_translations and academic_cohorts are
-- genuinely public reads that RLS already scopes correctly.

-- 1. Every write privilege off `anon`, schema-wide -------------------------------------
--
-- Verified on a local database that this removes nothing the application uses: the only
-- non-SELECT policy in `public` that a true anonymous caller can satisfy is
-- `registrations_insert_public`. Every other write policy naming `anon` (directly or via
-- TO public) requires auth.uid() or is_admin(auth.uid()) in its USING/CHECK —
-- profiles_insert_admin_only, enrollments_insert_admin, tutor_student_rel_update_admin,
-- push_subscriptions_users_own — which an anonymous caller can never satisfy. The two
-- anon-key API routes that do write (api/analytics/events, api/push/subscribe) both
-- return 401 before touching the database when there is no session, and once there is a
-- session the effective role is `authenticated`, whose INSERT/UPDATE/DELETE stay intact.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. The one legitimate anonymous write, restored immediately --------------------------
--
-- ORDER MATTERS: the blanket revoke above takes this away, so it has to come after.
-- The public registration form (src/app/[locale]/register/actions.ts) inserts the lead
-- with the SSR client on the anon key; with no session the effective role is `anon` and
-- `registrations_insert_public` is what permits the row. Drop this line and public
-- registration breaks for every tenant. INSERT only: anon still cannot read, amend or
-- delete a lead — that is admin-only through RLS.
GRANT INSERT ON public.registrations TO anon;

-- 3. TRUNCATE, TRIGGER and REFERENCES off `authenticated` too --------------------------
--
-- Same argument as above and it is not academic. RLS cannot gate any of these three for
-- `authenticated` either:
--   * TRUNCATE — no policy applies; a logged-in user could empty a table outright.
--   * TRIGGER — 166 also ran GRANT ALL ON ALL ROUTINES, so `authenticated` holds EXECUTE
--     on SECURITY DEFINER trigger functions such as sync_class_credit_ledger(). TRIGGER
--     on a table plus EXECUTE on such a function is enough to attach the ledger writer
--     to an unrelated table and corrupt billing from a browser session.
--   * REFERENCES — lets a caller add a foreign key pointing at a table and use the
--     constraint check as an oracle for rows RLS is hiding.
-- INSERT, UPDATE, DELETE and SELECT are kept: the application depends on all four for
-- `authenticated` and RLS scopes them per row. No application path issues CREATE TRIGGER
-- or ALTER TABLE ... ADD FOREIGN KEY; DDL runs as `postgres` through this directory.
REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public FROM authenticated;

-- 3b. MAINTAIN, on PostgreSQL 17 and newer only ----------------------------------------
--
-- Not in the original brief; found while verifying step 1 against the live database.
-- `GRANT ALL` on PG17 includes MAINTAIN, which information_schema.role_table_grants does
-- not report, so it is invisible to the usual audit query — `anon` held it on every table
-- (has_table_privilege('anon', 'public.profiles', 'MAINTAIN') was true after steps 1-3).
-- It allows VACUUM, ANALYZE, CLUSTER, REINDEX and REFRESH MATERIALIZED VIEW on the table.
-- Same defect class as TRUNCATE: row security cannot gate it, and PostgREST cannot issue
-- it, so it is unreachable from the public API but has no legitimate purpose either.
--
-- Wrapped in a version guard because MAINTAIN does not exist before PG17 and naming it
-- there is a syntax error that would abort this migration on an older tenant. The guard
-- makes it a no-op on PG16 and below rather than a failure. Local is 17.6.
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 170000 THEN
    EXECUTE 'REVOKE MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    -- Explicit `||` rather than two adjacent literals: implicit string continuation only
    -- holds while the newline between them survives, and reflowing this onto one line
    -- would turn it into a syntax error.
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public'
            || ' REVOKE MAINTAIN ON TABLES FROM anon, authenticated';
  END IF;
END
$$;

-- 4. The actual bug: stop the recurrence ----------------------------------------------
--
-- Everything above is a one-off cleanup. This is the part that stops the hole reopening.
-- 166 set ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO anon, authenticated, so
-- every table created since is born with ALL granted to `anon` before any policy exists.
-- That is exactly how section_enrollment_links — a table whose whole security model is
-- "no grants, no policies" — came to need an explicit REVOKE in migration 182, and why
-- 180 needed one too.
--
-- BLAST RADIUS, deliberately accepted: from here on a new table in `public` is born
-- SELECT-only for `anon` and without TRUNCATE/TRIGGER/REFERENCES for `authenticated`.
-- A future migration that wants anonymous writes must say so explicitly, per table, as
-- in step 2. That is the point: anonymous write access becomes a decision someone wrote
-- down rather than a default nobody chose. SELECT is left in the defaults so new public
-- read surfaces keep working the way migrations 167-184 assume, and `service_role` is
-- untouched everywhere, so admin clients and SECURITY DEFINER paths are unaffected.
--
-- FOR ROLE postgres is the whole fix in practice, not a partial one: migrations run as
-- `postgres` and every table in `public` is owned by `postgres`. There is a second,
-- Supabase-platform default ACL owned by `supabase_admin` that still carries ALL for
-- `anon`; it cannot be altered from here (`postgres` is not a member of
-- `supabase_admin`) and it does not apply, because it only governs tables that
-- `supabase_admin` itself creates. If a future table is ever created by that role, it
-- will need an explicit REVOKE.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;

-- 5. Sequences, same root cause ---------------------------------------------------------
--
-- 166 also ran GRANT ALL ON ALL SEQUENCES, so `anon` holds SELECT, UPDATE and USAGE on
-- `public.payment_flow_commerce_serial_seq` — the only sequence in the schema. UPDATE and
-- USAGE together allow nextval and setval, which would let the anonymous role burn or
-- rewind the Flow.cl commerceOrder counter.
--
-- Safe to take away: the sequence has no owning table and its only two consumers,
-- `payment_flow_reserve_commerce_ref` and `payment_flow_reserve_commerce_ref_slot`, are
-- SECURITY DEFINER functions owned by `postgres`, so they draw values with the definer's
-- privileges and never the caller's. `authenticated` keeps its grants: logged-in checkout
-- paths are out of scope here and a wrong guess would break payments.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;

-- Idempotent by construction: REVOKE of an absent privilege and GRANT of a held one are
-- both no-ops, and ALTER DEFAULT PRIVILEGES ... REVOKE re-runs cleanly. Confirmed by
-- applying this file twice in a row against the local database. Nothing here touches a
-- row or a column, so rule 21 has nothing to object to: the words TRUNCATE and MAINTAIN
-- appear only as privilege names inside REVOKE.
