import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export async function loadStudentDisplayNameForFlow(
  supabase: SupabaseClient,
  studentId: string,
  emptyFallback: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", studentId)
    .maybeSingle();

  const label = formatProfileSnakeSurnameFirst(data ?? {}, "");
  const t = label.trim();
  return t.length > 0 ? t : emptyFallback;
}
