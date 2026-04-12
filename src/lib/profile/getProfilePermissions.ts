import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfilePermissions = {
  /** Payments and receipts in the student portal (adults only, or not flagged as minor). */
  canAccessPaymentsModule: boolean;
  isMinor: boolean;
};

export async function getProfilePermissions(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfilePermissions | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_minor")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const isMinor = Boolean(data.is_minor);
  return {
    canAccessPaymentsModule: !isMinor,
    isMinor,
  };
}
