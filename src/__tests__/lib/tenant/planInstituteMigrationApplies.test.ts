// REGRESSION CHECK: project targets keep the git SQL; shared schemas get a rewrite
// and skip brand-data files. Unqualified creates fail only on shared schemas.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  instituteTargetFromRecord,
  isBrandDataMigration,
  planInstituteMigrationApplies,
} from "@/lib/tenant/planInstituteMigrationApplies";

const productSql = "CREATE TABLE public.courses (id uuid primary key);";

const OLD_BRAND_FILE =
  /_(?:nago|golden|liora|mimundo|mozarthitos|espaciozenit)_(?:seed|tagline|brand)(?:_|\.|$)|site_theme_(?:nago|golden|liora|mimundo|mozarthitos|espaciozenit)_seed\.sql$/i;

describe("isBrandDataMigration", () => {
  it("reads the first-line marker and ignores a slug in the file name", () => {
    expect(isBrandDataMigration("269_site_theme_matiss_row.sql", "-- ge:brand-data matiss")).toBe(true);
    expect(isBrandDataMigration("108_site_theme_nago_seed.sql", "-- product seed")).toBe(false);
    expect(isBrandDataMigration("093_site_theme_kind_mozarthitos.sql", "")).toBe(false);
  });

  it("finds the marker on every file the old slug regex used to match", () => {
    const dir = path.join(process.cwd(), "supabase/migrations");
    const names = readdirSync(dir).filter((name) => OLD_BRAND_FILE.test(name));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const first = readFileSync(path.join(dir, name), "utf8").split(/\r?\n/, 1)[0] ?? "";
      expect(first, name).toMatch(/^-- ge:brand-data [a-z0-9-]+$/);
    }
  });
});

describe("instituteTargetFromRecord", () => {
  it("defaults a control-plane row to an external project", () => {
    expect(
      instituteTargetFromRecord({
        slug: "Nago",
        database_url: "postgres://db/nago",
        is_enabled: true,
      }),
    ).toEqual({
      slug: "nago",
      dataMode: "project",
      databaseUrl: "postgres://db/nago",
      postgresSchema: "public",
    });
  });

  it("drops a disabled row and keeps a shared schema", () => {
    expect(instituteTargetFromRecord({ slug: "old", is_enabled: false, database_url: "x" })).toBeNull();
    expect(
      instituteTargetFromRecord({
        slug: "acme",
        databaseUrl: "postgres://shared",
        dataMode: "shared_schema",
        postgresSchema: "tenant_acme",
      })?.postgresSchema,
    ).toBe("tenant_acme");
  });
});

describe("planInstituteMigrationApplies", () => {
  const project = {
    slug: "nago",
    dataMode: "project",
    databaseUrl: "postgres://nago",
    postgresSchema: "public",
  };
  const shared = {
    slug: "acme",
    dataMode: "shared_schema",
    databaseUrl: "postgres://shared",
    postgresSchema: "tenant_acme",
  };

  it("sends the original SQL to an external project and a rewrite to a shared schema", () => {
    const [external, internal] = planInstituteMigrationApplies({
      fileName: "232_courses.sql",
      sql: productSql,
      targets: [project, shared],
    });
    expect(external).toMatchObject({ action: "execute", sql: productSql, ledgerSchema: "public" });
    expect(internal).toMatchObject({
      action: "execute",
      ledgerSchema: "tenant_acme",
    });
    if (internal?.action === "execute") {
      expect(internal.sql).toContain("tenant_acme.courses");
      expect(internal.sql).not.toContain("public.courses");
    }
  });

  it("runs brand data on an external project and skips it on a shared schema", () => {
    const planned = planInstituteMigrationApplies({
      fileName: "108_site_theme_nago_seed.sql",
      sql: `-- ge:brand-data nago\n${productSql}`,
      targets: [project, shared],
    });
    expect(planned[0]).toMatchObject({ action: "execute" });
    expect(planned[1]).toEqual({ slug: "acme", action: "skip", reason: "brand_data" });
  });

  it("rejects an unqualified create only for a shared schema", () => {
    const planned = planInstituteMigrationApplies({
      fileName: "233_bare.sql",
      sql: "CREATE TABLE courses (id int);",
      targets: [project, shared],
    });
    expect(planned[0]).toMatchObject({ action: "execute" });
    expect(planned[1]).toMatchObject({ action: "error", message: "unqualified_public:courses" });
  });

  it("rejects a missing database url and an unknown data mode", () => {
    const planned = planInstituteMigrationApplies({
      fileName: "232_courses.sql",
      sql: productSql,
      targets: [
        { ...project, databaseUrl: "  " },
        { ...shared, dataMode: "schema" },
      ],
    });
    expect(planned[0]).toMatchObject({ message: "missing_database_url" });
    expect(planned[1]).toMatchObject({ message: "invalid_data_mode" });
  });
});
