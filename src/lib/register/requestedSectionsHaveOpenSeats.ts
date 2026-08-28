type RpcClient = {
  rpc: (
    fn: string,
    args: { p_section_id: string },
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

export async function requestedSectionsHaveOpenSeats(
  supabase: RpcClient,
  sectionIds: string[],
): Promise<boolean> {
  const ids = [...new Set(sectionIds.map((id) => id.trim()).filter(Boolean))];
  for (const id of ids) {
    const { data, error } = await supabase.rpc(
      "registration_public_section_has_open_seat",
      { p_section_id: id },
    );
    if (error || data !== true) return false;
  }
  return true;
}
