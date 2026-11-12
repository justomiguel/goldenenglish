type PinRow = { variant_id: string; major: number };

type PinRead = {
  from(table: "platform_tenant_variant_pins"): {
    select(columns: "variant_id, major"): {
      range(from: number, to: number): Promise<{ data: PinRow[] | null; error: { message: string } | null }>;
    };
  };
};

/**
 * Pin rows grow with each institute, so the read walks pages of at most 1000.
 * The result is grouped by variant id and major (rule 13).
 */
export async function loadVariantFleetCounts(client: PinRead, pageSize = 1000): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("platform_tenant_variant_pins")
      .select("variant_id, major")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const row of rows) {
      const key = `${row.variant_id}@${row.major}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    if (rows.length < pageSize) return counts;
  }
}
