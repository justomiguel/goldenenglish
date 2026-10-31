const TENANT_SCHEMA_NAME = /^tenant_[a-z0-9_]{1,50}$/;

const PRODUCT_CREATE =
  /\bcreate\s+(?:or\s+replace\s+)?(?:unlogged\s+|temp(?:orary)?\s+)?(table|function|procedure|view|materialized\s+view|type|sequence)\s+(?:if\s+not\s+exists\s+)?([^\s(]+)/gi;

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

function isQualifiedProductName(name: string): boolean {
  const normalized = name.replace(/"/g, "").toLowerCase();
  return (
    normalized.startsWith("public.") ||
    normalized.startsWith("auth.") ||
    normalized.startsWith("storage.") ||
    normalized.startsWith("extensions.") ||
    normalized.startsWith("pg_catalog.")
  );
}

/** Names of product objects created without a schema qualifier. */
export function listUnqualifiedProductCreates(sql: string): string[] {
  const bare: string[] = [];
  const source = stripSqlComments(sql);
  for (const match of source.matchAll(PRODUCT_CREATE)) {
    const name = match[2]?.trim();
    if (!name || isQualifiedProductName(name)) continue;
    if (!bare.includes(name)) bare.push(name);
  }
  return bare;
}

/**
 * In-memory copy for one institute schema.
 * `auth.` and `storage.` stay. The git file is not modified.
 */
export function rewriteInstituteMigrationSql(sql: string, postgresSchema: string): string {
  if (!TENANT_SCHEMA_NAME.test(postgresSchema)) {
    throw new Error(`invalid_tenant_schema:${postgresSchema}`);
  }
  const rewritten = sql
    .replace(/\b(search_path\s*(?:=|to)\s*)public\b/gi, `$1${postgresSchema}`)
    .replace(/(^|[^a-zA-Z0-9_])public\./gi, `$1${postgresSchema}.`)
    .replace(/"public"\./g, `"${postgresSchema}".`)
    .replace(/\b(nspname|table_schema)\s*=\s*'public'/gi, `$1 = '${postgresSchema}'`)
    .replace(/(^|[^.\w])gen_random_bytes\s*\(/gi, "$1extensions.gen_random_bytes(");
  return `SET search_path TO ${postgresSchema}, extensions;\n${rewritten}`;
}

/** One trigger on auth.users serves every shared institute. Drop per-schema copies. */
export function stripAuthUsersTriggers(sql: string): string {
  return sql.replace(/create\s+trigger\b[\s\S]*?\bon\s+auth\.users\b[\s\S]*?;/gi, "");
}
