import {
  listUnqualifiedProductCreates,
  rewriteInstituteMigrationSql,
  // Node loads this file for the apply script and requires the .ts specifier.
  // @ts-expect-error TS5097 — Next typecheck does not allow a .ts import specifier.
} from "./rewriteInstituteMigrationSql.ts";

const BRAND_DATA_FILE =
  /_(?:nago|golden|liora|mimundo|mozarthitos|espaciozenit)_(?:seed|tagline|brand)(?:_|\.|$)|site_theme_(?:nago|golden|liora|mimundo|mozarthitos|espaciozenit)_seed\.sql$/i;

export type InstituteMigrationTarget = {
  slug: string;
  dataMode: string;
  databaseUrl: string;
  postgresSchema: string;
};

export type PlannedInstituteMigration =
  | {
      slug: string;
      action: "execute";
      databaseUrl: string;
      sql: string;
      ledgerSchema: string | null;
    }
  | { slug: string; action: "skip"; reason: "brand_data" }
  | { slug: string; action: "error"; message: string };

export function isBrandDataMigration(fileName: string): boolean {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  return BRAND_DATA_FILE.test(base);
}

function readString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** Maps a `platform_tenants` row or a `TENANTS_CONFIG_JSON` object. Disabled rows return null. */
export function instituteTargetFromRecord(
  row: Record<string, unknown>,
): InstituteMigrationTarget | null {
  const enabled = row.is_enabled ?? row.isEnabled;
  if (enabled === false) return null;

  const slug = readString(row, "slug").toLowerCase();
  if (!slug) return null;

  const databaseUrl = readString(row, "databaseUrl", "database_url");
  const dataMode = readString(row, "dataMode", "data_mode").toLowerCase() || "project";
  const postgresSchema =
    dataMode === "shared_schema"
      ? readString(row, "postgresSchema", "postgres_schema").toLowerCase()
      : "public";

  return { slug, dataMode, databaseUrl, postgresSchema };
}

export function planInstituteMigrationApplies(input: {
  fileName: string;
  sql: string;
  targets: readonly InstituteMigrationTarget[];
}): PlannedInstituteMigration[] {
  const brandData = isBrandDataMigration(input.fileName);
  const unqualified = listUnqualifiedProductCreates(input.sql);

  return input.targets.map((target) => {
    if (!target.databaseUrl.trim()) {
      return { slug: target.slug, action: "error", message: "missing_database_url" };
    }
    if (target.dataMode !== "project" && target.dataMode !== "shared_schema") {
      return { slug: target.slug, action: "error", message: "invalid_data_mode" };
    }
    if (target.dataMode === "project") {
      return {
        slug: target.slug,
        action: "execute",
        databaseUrl: target.databaseUrl,
        sql: input.sql,
        ledgerSchema: "public",
      };
    }
    if (brandData) {
      return { slug: target.slug, action: "skip", reason: "brand_data" };
    }
    if (unqualified.length > 0) {
      return {
        slug: target.slug,
        action: "error",
        message: `unqualified_public:${unqualified.join(",")}`,
      };
    }
    try {
      return {
        slug: target.slug,
        action: "execute",
        databaseUrl: target.databaseUrl,
        sql: rewriteInstituteMigrationSql(input.sql, target.postgresSchema),
        ledgerSchema: target.postgresSchema,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "rewrite_failed";
      return { slug: target.slug, action: "error", message };
    }
  });
}
