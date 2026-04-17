import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_CHUNK_SIZE = 200;

/**
 * Splits a large `.in(column, ids)` query into chunks to avoid
 * PostgREST URL length limits. Returns the merged rows.
 */
export async function chunkedIn<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  column: string,
  ids: string[],
  select: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
): Promise<T[]> {
  if (ids.length === 0) return [];

  const unique = [...new Set(ids)];
  const results: T[] = [];

  for (let i = 0; i < unique.length; i += chunkSize) {
    const batch = unique.slice(i, i + chunkSize);
    const { data } = await client
      .from(table)
      .select(select)
      .in(column, batch);
    if (data) results.push(...(data as unknown as T[]));
  }

  return results;
}
