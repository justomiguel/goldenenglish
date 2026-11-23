import { mapAiCallError } from "@/lib/ai/aiError";
import { logServerError } from "@/lib/logging/serverActionLog";
import type { AiFail, AiThreadStore, AiTurnStore } from "@/lib/ai/aiStores";
import type { AiActor } from "@/lib/ai/conversationRules";
import type { AiListedTurn, LanguageModel } from "@/lib/ai/languageModel";
import { loadOwnedThread } from "@/lib/ai/loadOwnedThread";

const PAGE = 100;

export async function listTurns(
  input: { actor: AiActor; threadId: string; after?: string },
  deps: { threads: AiThreadStore; turns: AiTurnStore; modelFor(providerId: string): Promise<LanguageModel | AiFail> },
): Promise<{ ok: true; items: AiListedTurn[]; hasMore: boolean; lastId: string | null } | AiFail> {
  const owned = await loadOwnedThread(deps.threads, input.actor, input.threadId);
  if (!owned.ok) return owned;
  if (owned.row.memoryMode === "system_log") {
    const rows = (await deps.turns.list(owned.row.id)).filter((turn) => turn.role !== "summary");
    const start = input.after ? rows.findIndex((turn) => turn.id === input.after) + 1 : 0;
    const page = rows.slice(Math.max(0, start), Math.max(0, start) + PAGE);
    const last = page.at(-1);
    return {
      ok: true,
      items: page.map((turn) => ({ id: turn.id, role: turn.role, text: turn.body })),
      hasMore: start + page.length < rows.length,
      lastId: last?.id ?? null,
    };
  }
  const language = await deps.modelFor(owned.row.providerId);
  if ("ok" in language) return language;
  try {
    const page = await language.listThreadItems(owned.row.providerThreadId ?? "", input.after);
    return { ok: true, items: page.items.filter((item) => item.role || item.text), hasMore: page.hasMore, lastId: page.lastId };
  } catch (err) {
    const mapped = mapAiCallError(err);
    await logServerError("listTurns", { code: mapped.code, requestId: mapped.requestId });
    return { ok: false, errorCode: mapped.code };
  }
}
