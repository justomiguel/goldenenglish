-- Ensure PostgREST API roles can reach public tables so RLS can apply.
--
-- Local `supabase db reset` runs app migrations as role `postgres`. That role's
-- default privileges previously granted only DELETE/TRUNCATE/REFERENCES/TRIGGER
-- (Dxtm) to anon/authenticated/service_role — not SELECT/INSERT/UPDATE — so
-- every table looked "permission denied" under the API.
--
-- Idempotent. Safe on hosted tenants: grants align with Supabase norms; RLS unchanged.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
