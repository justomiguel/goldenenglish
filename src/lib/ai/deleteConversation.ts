import { logServerError } from "@/lib/logging/serverActionLog";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { mapAiCallError } from "@/lib/ai/aiError";
import type { AiFail, AiThreadStore, AiTurnStore } from "@/lib/ai/aiStores";
import type { AiActor } from "@/lib/ai/conversationRules";
import type { LanguageModel } from "@/lib/ai/languageModel";
import { loadOwnedThread } from "@/lib/ai/loadOwnedThread";

export async function deleteConversation(
  input: { actor: AiActor; threadId: string },
  deps: { threads: AiThreadStore; turns: AiTurnStore; modelFor(providerId: string): Promise<LanguageModel | AiFail> },
): Promise<{ ok: true } | AiFail> {
  const owned = await loadOwnedThread(deps.threads, input.actor, input.threadId);
  if (!owned.ok) return owned;
  if (owned.row.memoryMode === "provider_thread" && owned.row.providerThreadId) {
    const language = await deps.modelFor(owned.row.providerId);
    if ("ok" in language) return language;
    try {
      await language.eraseThread(owned.row.providerThreadId);
    } catch (err) {
      const mapped = mapAiCallError(err);
      await logServerError("deleteConversation", { code: mapped.code, requestId: mapped.requestId });
      return { ok: false, errorCode: mapped.code === "ai_unavailable" ? "ai_delete_incomplete" : mapped.code };
    }
  }
  if (owned.row.memoryMode === "system_log") {
    const erased = await deps.turns.erase(owned.row.id);
    if (!erased.ok) return { ok: false, errorCode: "ai_delete_incomplete" };
  }
  const marked = await deps.threads.markDeleted(owned.row.id);
  if (!marked.ok) return { ok: false, errorCode: "ai_delete_incomplete" };
  const event = await recordUserEventServer({
    userId: owned.row.ownerUserId,
    eventType: "action",
    entity: AnalyticsEntity.aiThread,
    metadata: { threadId: owned.row.id, deleted: true },
  });
  if (!event.ok) await logServerError("deleteConversation:event", { threadId: owned.row.id });
  return { ok: true };
}
