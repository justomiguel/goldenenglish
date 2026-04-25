import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Suma 1 al contador de seguimiento (WhatsApp o email) para la matrícula.
 * Requiere sesión con admin (la RPC verifica `is_admin(auth.uid())`).
 */
export async function incrementRetentionContactCount(
  supabase: SupabaseClient,
  enrollmentId: string,
  channel: "whatsapp" | "email",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.rpc("increment_enrollment_retention_contact", {
    p_enrollment_id: enrollmentId,
    p_channel: channel,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
