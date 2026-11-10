const IDENT = /^[a-z_][a-z0-9_]*$/i;

export function quoteIdent(name: string): string {
  if (!IDENT.test(name)) throw new Error("bad_ident");
  return `"${name}"`;
}

export function selectPageSql(
  schema: string,
  table: string,
  columns: readonly string[],
  limit: number,
  offset: number,
): string {
  const cols = columns.map(quoteIdent).join(", ");
  const safeLimit = Math.min(1000, Math.max(1, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  return `SELECT ${cols} FROM ${quoteIdent(schema)}.${quoteIdent(table)} ORDER BY 1 LIMIT ${safeLimit} OFFSET ${safeOffset}`;
}

export function insertRowSql(schema: string, table: string, columns: readonly string[]): string {
  const cols = columns.map(quoteIdent).join(", ");
  const params = columns.map((_, index) => `$${index + 1}`).join(", ");
  return `INSERT INTO ${quoteIdent(schema)}.${quoteIdent(table)} (${cols}) VALUES (${params})`;
}

export function columnPlan(
  fileColumns: readonly string[],
  tableColumns: readonly string[],
): { ok: true; insert: string[] } | { ok: false; code: "schema_load_failed" } {
  const live = new Set(tableColumns);
  if (fileColumns.some((column) => !live.has(column))) {
    return { ok: false, code: "schema_load_failed" };
  }
  return { ok: true, insert: [...fileColumns] };
}

export function rowsToNdjson(rows: readonly Record<string, unknown>[]): string {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

export function parseNdjson(text: string): Record<string, unknown>[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}
