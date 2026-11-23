import { randomUUID } from "crypto";
import { logServerError } from "@/lib/logging/serverActionLog";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { mapAiCallError } from "@/lib/ai/aiError";
import type { AiFail, AiThread, AiThreadStore, AiTurnStore } from "@/lib/ai/aiStores";
import { parseAiTurnText, type AiActor } from "@/lib/ai/conversationRules";
import type { LanguageModel } from "@/lib/ai/languageModel";
import { loadOwnedThread } from "@/lib/ai/loadOwnedThread";
import { foldPrompt, needsFold, promptMessages, unfoldedTurns, type LogTurn } from "@/lib/ai/systemLogWindow";

type Deps = {
  threads: AiThreadStore;
  turns: AiTurnStore;
  modelFor(providerId: string): Promise<LanguageModel | AiFail>;
};

async function fail(err: unknown, scope: string): Promise<AiFail> {
  const mapped = mapAiCallError(err);
  await logServerError(scope, { code: mapped.code, requestId: mapped.requestId });
  return { ok: false, errorCode: mapped.code };
}

async function foldIfNeeded(row: AiThread, text: string, language: LanguageModel, turns: AiTurnStore): Promise<AiFail | { ok: true }> {
  const current = await turns.list(row.id);
  if (!needsFold(current, text)) return { ok: true };
  let summaryText = "";
  try {
    const summary = await language.send({ model: row.model, providerThreadId: null, messages: foldPrompt(current) });
    summaryText = summary.outputText.trim();
  } catch (err) {
    await fail(err, "sendTurn:fold");
    return { ok: false, errorCode: "ai_compaction_failed" };
  }
  if (!summaryText) return { ok: false, errorCode: "ai_compaction_failed" };
  const ids = [...unfoldedTurns(current).map((turn) => turn.id), ...current.filter((turn) => turn.role === "summary" && !turn.foldedAt).map((turn) => turn.id)];
  const folded = await turns.fold(ids, new Date().toISOString());
  if (!folded.ok) return { ok: false, errorCode: "ai_compaction_failed" };
  const summaryTurn: LogTurn = { id: randomUUID(), role: "summary", body: summaryText, foldedAt: null };
  const inserted = await turns.insert(row.id, summaryTurn);
  if (!inserted.ok) return { ok: false, errorCode: "ai_compaction_failed" };
  return { ok: true };
}

export async function sendTurn(
  input: { actor: AiActor; threadId: string; text: string },
  deps: Deps,
): Promise<{ ok: true; outputText: string; requestId: string | null } | AiFail> {
  const owned = await loadOwnedThread(deps.threads, input.actor, input.threadId);
  if (!owned.ok) return owned;
  const text = parseAiTurnText(input.text);
  if (!text) return { ok: false, errorCode: "ai_input_invalid" };
  const language = await deps.modelFor(owned.row.providerId);
  if ("ok" in language) return language;
  const instructions = owned.row.instructions && !owned.row.instructionsSent ? owned.row.instructions : null;
  if (owned.row.memoryMode === "system_log") {
    const folded = await foldIfNeeded(owned.row, text, language, deps.turns);
    if (!folded.ok) return folded;
  }
  const stored = owned.row.memoryMode === "system_log" ? await deps.turns.list(owned.row.id) : [];
  const messages = owned.row.memoryMode === "system_log" ? promptMessages(stored, text, instructions) : [
    ...(instructions ? [{ role: "developer" as const, content: instructions }] : []),
    { role: "user" as const, content: text },
  ];
  let outputText = "";
  let requestId: string | null = null;
  try {
    const response = await language.send({ model: owned.row.model, providerThreadId: owned.row.providerThreadId, messages });
    outputText = response.outputText.trim();
    requestId = response.requestId;
  } catch (err) {
    return fail(err, "sendTurn");
  }
  if (!outputText) return { ok: false, errorCode: "ai_empty_output" };
  if (owned.row.memoryMode === "system_log") {
    const userSaved = await deps.turns.insert(owned.row.id, { id: randomUUID(), role: "user", body: text, foldedAt: null });
    const replySaved = await deps.turns.insert(owned.row.id, { id: randomUUID(), role: "assistant", body: outputText, foldedAt: null });
    if (!userSaved.ok || !replySaved.ok) return { ok: false, errorCode: "ai_unavailable" };
  }
  if (instructions) {
    const marked = await deps.threads.markInstructionsSent(owned.row.id);
    if (!marked.ok) return marked;
  }
  const event = await recordUserEventServer({
    userId: owned.row.ownerUserId,
    eventType: "action",
    entity: AnalyticsEntity.aiThread,
    metadata: { threadId: owned.row.id },
  });
  if (!event.ok) await logServerError("sendTurn:event", { threadId: owned.row.id });
  return { ok: true, outputText, requestId };
}
