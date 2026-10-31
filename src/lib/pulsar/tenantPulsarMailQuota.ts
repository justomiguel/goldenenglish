import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export type PulsarMailReserve = "reserved" | "quota" | "missing";

export async function reservePulsarMailSend(slug: string): Promise<PulsarMailReserve> {
  if (!isPulsarSupabaseConfigured()) return "missing";
  const admin = createPulsarAdminClient();
  const { data, error } = await admin.rpc("reserve_platform_tenant_mail", { p_slug: slug });
  if (error) {
    logSupabaseError("reservePulsarMailSend", error, { slug });
    return "missing";
  }
  if (data === "reserved" || data === "quota" || data === "missing") return data;
  return "missing";
}

export async function releasePulsarMailSend(slug: string): Promise<void> {
  if (!isPulsarSupabaseConfigured()) return;
  const admin = createPulsarAdminClient();
  const { error } = await admin.rpc("release_platform_tenant_mail", { p_slug: slug });
  if (error) logSupabaseError("releasePulsarMailSend", error, { slug });
}
