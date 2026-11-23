import { normalizeAiActor, type AiActor } from "@/lib/ai/conversationRules";
import type { AiFail, AiThread, AiThreadStore } from "@/lib/ai/aiStores";

export async function loadOwnedThread(
  store: AiThreadStore,
  actor: AiActor,
  threadId: string,
): Promise<{ ok: true; row: AiThread } | AiFail> {
  const normalized = normalizeAiActor(actor);
  if (!normalized) return { ok: false, errorCode: "ai_thread_forbidden" };
  const row = await store.findById(threadId);
  if (!row || row.deletedAt || row.host !== normalized.host) return { ok: false, errorCode: "ai_thread_missing" };
  if (row.ownerUserId !== normalized.userId) return { ok: false, errorCode: "ai_thread_forbidden" };
  return { ok: true, row };
}
