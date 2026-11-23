import { randomUUID } from "crypto";
import { logServerError } from "@/lib/logging/serverActionLog";
import { mapAiCallError } from "@/lib/ai/aiError";
import type { AiCatalog, AiFail, AiThread, AiThreadStore } from "@/lib/ai/aiStores";
import { normalizeAiActor, parseAiInstructions, parseAiModel, type AiActor } from "@/lib/ai/conversationRules";
import type { LanguageModel } from "@/lib/ai/languageModel";

export type StartConversationDeps = {
  catalog: AiCatalog;
  threads: AiThreadStore;
  modelFor(providerId: string): Promise<LanguageModel | AiFail>;
};

export async function startConversation(
  input: { actor: AiActor; model: string; instructions?: string | null },
  deps: StartConversationDeps,
): Promise<{ ok: true; threadId: string } | AiFail> {
  const actor = normalizeAiActor(input.actor);
  const model = parseAiModel(input.model);
  const instructions = parseAiInstructions(input.instructions);
  if (!actor || !model || instructions === "invalid") return { ok: false, errorCode: "ai_input_invalid" };
  const provider = await deps.catalog.binding("conversation");
  if (!provider) return { ok: false, errorCode: "ai_service_unbound" };
  if (!provider.enabled) return { ok: false, errorCode: "ai_provider_disabled" };
  if (provider.kind === "azure") return { ok: false, errorCode: "ai_provider_unsupported" };
  const language = await deps.modelFor(provider.id);
  if ("ok" in language) return language;
  let providerThreadId: string | null = null;
  try {
    providerThreadId = await language.openThread();
  } catch (err) {
    const mapped = mapAiCallError(err);
    await logServerError("startConversation", { code: mapped.code, requestId: mapped.requestId });
    return { ok: false, errorCode: mapped.code };
  }
  const row: AiThread = {
    id: randomUUID(),
    service: "conversation",
    host: actor.host,
    ownerUserId: actor.userId,
    providerId: provider.id,
    memoryMode: language.memoryMode,
    model,
    providerThreadId,
    instructions,
    instructionsSent: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
  const inserted = await deps.threads.insert(row);
  if (!inserted.ok) return inserted;
  return { ok: true, threadId: row.id };
}
