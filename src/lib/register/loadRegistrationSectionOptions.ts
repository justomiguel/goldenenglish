import { createClient } from "@/lib/supabase/server";

export async function loadRegistrationSectionOptions(): Promise<
  { id: string; label: string }[]
> {
  const supabase = await createClient();
  const { data: sectionOpts } = await supabase.rpc("list_registration_section_options");
  return (sectionOpts ?? []).map((row: { id: string; label: string }) => ({
    id: String(row.id),
    label: String(row.label),
  }));
}
