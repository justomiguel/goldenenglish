import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import type { AiProviderList, AiProviderListItem } from "@/lib/ai/aiProviderList";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const EMPTY: AiProviderList = { providers: [], conversationProviderId: null };

export async function loadAiProviderList(): Promise<AiProviderList> {
  if (!isPulsarSupabaseConfigured()) return EMPTY;
  const admin = createPulsarAdminClient();
  const providers = await admin
    .from("platform_ai_providers")
    .select("id, label, enabled, api_key_last4")
    .order("created_at", { ascending: false })
    .range(0, 49);
  const binding = await admin.from("platform_ai_service_bindings").select("provider_id").eq("service", "conversation").maybeSingle();
  if (providers.error || binding.error) {
    logSupabaseError("loadAiProviderList", providers.error ?? binding.error, {});
    return EMPTY;
  }
  const rows: AiProviderListItem[] = (providers.data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label),
    enabled: Boolean(row.enabled),
    last4: row.api_key_last4 == null ? null : String(row.api_key_last4),
  }));
  return {
    providers: rows,
    conversationProviderId: binding.data?.provider_id ? String(binding.data.provider_id) : null,
  };
}
