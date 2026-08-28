import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";

type RpcClient = {
  rpc: (
    fn: string,
    args: { p_section_id: string },
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

export function markRegistrationRowsClosedSections<
  T extends {
    preferred_section_id: string | null;
    additionalSectionIds?: string[] | null;
  },
>(rows: T[], closedIds: ReadonlySet<string>): Array<T & { requestedSectionFull: boolean }> {
  return rows.map((row) => ({
    ...row,
    requestedSectionFull: requestedRegistrationSectionIds(row).some((id) =>
      closedIds.has(id),
    ),
  }));
}

export async function collectClosedRequestedSectionIds(
  supabase: RpcClient,
  sectionIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(sectionIds.map((id) => id.trim()).filter(Boolean))];
  const closed = new Set<string>();
  for (const id of ids) {
    const { data, error } = await supabase.rpc(
      "registration_public_section_has_open_seat",
      { p_section_id: id },
    );
    if (error || data !== true) closed.add(id);
  }
  return closed;
}
