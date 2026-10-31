import { describe, expect, it } from "vitest";
import {
  listUnqualifiedProductCreates,
  rewriteInstituteMigrationSql,
  stripAuthUsersTriggers,
} from "@/lib/tenant/rewriteInstituteMigrationSql";

describe("rewriteInstituteMigrationSql", () => {
  const sql = `
CREATE TABLE public.profiles (id uuid primary key);
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN INSERT INTO public.profiles (id) VALUES (NEW.id); RETURN NEW; END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

  it("rewrites public qualifiers and search_path, and leaves auth.users", () => {
    const out = rewriteInstituteMigrationSql(sql, "tenant_acme");
    expect(out.startsWith("SET search_path TO tenant_acme, extensions;")).toBe(true);
    expect(out).toContain("CREATE TABLE tenant_acme.profiles");
    expect(out).toContain("SET search_path = tenant_acme");
    expect(out).toContain("INSERT INTO tenant_acme.profiles");
    expect(out).toContain("EXECUTE FUNCTION tenant_acme.handle_new_user()");
    expect(out).toContain("ON auth.users");
    expect(out).not.toContain("public.");
  });

  it("points catalog checks at the institute schema", () => {
    const out = rewriteInstituteMigrationSql(
      `
      WHERE n.nspname = 'public' AND p.proname = 'section_enrollment_teacher_is_self';
      WHERE table_schema = 'public' AND table_name = 'learning_route_steps';
      CHECK (source IN ('public', 'logged_in'));
      `,
      "tenant_test",
    );
    expect(out).toContain("n.nspname = 'tenant_test'");
    expect(out).toContain("table_schema = 'tenant_test'");
    expect(out).toContain("source IN ('public', 'logged_in')");
  });

  it("keeps pgcrypto visible after the schema switch", () => {
    const out = rewriteInstituteMigrationSql(
      "UPDATE public.registrations SET pay_token = encode(gen_random_bytes(32), 'hex');",
      "tenant_test",
    );
    expect(out).toContain("extensions.gen_random_bytes(32)");
    expect(out).not.toContain("encode(gen_random_bytes(32)");
  });

  it("rejects a schema name that is not tenant_<slug>", () => {
    expect(() => rewriteInstituteMigrationSql(sql, "public")).toThrow(/invalid_tenant_schema/);
    expect(() => rewriteInstituteMigrationSql(sql, "tenant_Acme")).toThrow(/invalid_tenant_schema/);
  });
});

describe("listUnqualifiedProductCreates", () => {
  it("flags a table or function created without public.", () => {
    const names = listUnqualifiedProductCreates(`
      CREATE TABLE public.ok (id int);
      CREATE TABLE bare (id int);
      CREATE OR REPLACE FUNCTION also_bare() RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;
      -- CREATE TABLE commented (id int);
    `);
    expect(names).toEqual(["bare", "also_bare"]);
  });

  it("ignores policies, indexes, and triggers", () => {
    const names = listUnqualifiedProductCreates(`
      CREATE POLICY p ON public.profiles FOR SELECT USING (true);
      CREATE UNIQUE INDEX profiles_dni ON public.profiles (id);
      CREATE TRIGGER t AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    expect(names).toEqual([]);
  });
});

describe("stripAuthUsersTriggers", () => {
  it("removes the auth.users trigger and keeps the following statement", () => {
    const sql = stripAuthUsersTriggers(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION tenant_acme.handle_new_user();
      CREATE TABLE tenant_acme.profiles (id uuid);
    `);
    expect(sql.toLowerCase()).not.toContain("create trigger");
    expect(sql).toContain("CREATE TABLE tenant_acme.profiles");
  });
});
