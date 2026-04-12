import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfilePermissions = {
  /** Pagos y comprobantes en el portal alumno (solo mayores o sin marca de menor). */
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
