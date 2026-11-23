import "server-only";

import { deleteConversation } from "@/lib/ai/deleteConversation";
import { listTurns } from "@/lib/ai/listTurns";
import { sendTurn } from "@/lib/ai/sendTurn";
import { startConversation } from "@/lib/ai/startConversation";
import type { AiCatalog, AiFail } from "@/lib/ai/aiStores";
import type { LanguageModel } from "@/lib/ai/languageModel";
import { createOpenAiLanguageModel } from "@/lib/ai/providers/openai/openAiLanguageModel";
import { loadAiProviderKey } from "@/lib/ai/store/aiProviderStore";
import { createSupabaseAiThreadStore } from "@/lib/ai/store/aiThreadStore";
import { createSupabaseAiTurnStore } from "@/lib/ai/store/aiTurnStore";
import { createOpenAiSdkGateway } from "@/lib/ai/providers/openai/openAiSdkGateway";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function modelForProvider(providerId: string): Promise<LanguageModel | AiFail> {
  const key = await loadAiProviderKey(providerId);
  if (!key.ok) return key;
  return createOpenAiLanguageModel(createOpenAiSdkGateway(key.apiKey));
}

function catalog(): AiCatalog {
  return {
    async binding(service) {
      if (!isPulsarSupabaseConfigured()) return null;
      const { data, error } = await createPulsarAdminClient()
        .from("platform_ai_service_bindings")
        .select("provider_id")
        .eq("service", service)
        .maybeSingle();
      if (error || !data?.provider_id) return null;
      const provider = await createPulsarAdminClient()
        .from("platform_ai_providers")
        .select("id, kind, label, enabled, endpoint")
        .eq("id", data.provider_id)
        .maybeSingle();
      if (provider.error || !provider.data) return null;
      const kind = provider.data.kind === "azure" ? "azure" : "openai";
      return {
        id: String(provider.data.id),
        kind,
        label: String(provider.data.label),
        enabled: Boolean(provider.data.enabled),
        endpoint: provider.data.endpoint == null ? null : String(provider.data.endpoint),
      };
    },
  };
}

export function composeAi() {
  const deps = {
    catalog: catalog(),
    threads: createSupabaseAiThreadStore(),
    turns: createSupabaseAiTurnStore(),
    modelFor: modelForProvider,
  };
  return {
    start: (input: Parameters<typeof startConversation>[0]) => startConversation(input, deps),
    send: (input: Parameters<typeof sendTurn>[0]) => sendTurn(input, deps),
    list: (input: Parameters<typeof listTurns>[0]) => listTurns(input, deps),
    erase: (input: Parameters<typeof deleteConversation>[0]) => deleteConversation(input, deps),
  };
}
