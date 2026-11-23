import "server-only";

import { randomUUID } from "crypto";
import { logServerError } from "@/lib/logging/serverActionLog";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { mapOpenAiCallError } from "@/lib/ai/providers/openai/mapOpenAiCallError";
import type { OpenAiConversationRecord, OpenAiConversationStore } from "@/lib/ai/providers/openai/openAiConversationStore";
import type { OpenAiGateway, OpenAiInputItem, OpenAiListedItem } from "@/lib/ai/providers/openai/openAiGateway";
import { createOpenAiSdkGateway } from "@/lib/ai/providers/openai/openAiSdkGateway";
import { createSupabaseOpenAiConversationStore } from "@/lib/ai/providers/openai/supabaseOpenAiConversationStore";
import {
  normalizeOpenAiActor,
  parseOpenAiInstructions,
  parseOpenAiModel,
  parseOpenAiTurnText,
  type OpenAiActor,
} from "@/lib/ai/providers/openai/openAiTurnRules";

export const OPENAI_CONVERSATION_PAGE = 50;

type Fail = { ok: false; errorCode: string };
type Deps = { store: OpenAiConversationStore; gateway: OpenAiGateway };

function defaultDeps(): Deps {
  return { store: createSupabaseOpenAiConversationStore(), gateway: createOpenAiSdkGateway() };
}

async function recordTurn(userId: string, conversationId: string, deleted: boolean): Promise<void> {
  const saved = await recordUserEventServer({
    userId,
    eventType: "action",
    entity: AnalyticsEntity.openaiConversation,
    metadata: deleted ? { conversationId, deleted: true } : { conversationId },
  });
  if (!saved.ok) await logServerError("platformOpenAiConversation:event", { conversationId, deleted });
}

async function loadOwned(
  store: OpenAiConversationStore,
  actor: OpenAiActor,
  conversationId: string,
): Promise<{ ok: true; row: OpenAiConversationRecord } | Fail> {
  const normalized = normalizeOpenAiActor(actor);
  if (!normalized) return { ok: false, errorCode: "openai_conversation_forbidden" };
  const row = await store.findById(conversationId);
  if (!row || row.deletedAt || row.host !== normalized.host) {
    return { ok: false, errorCode: "openai_conversation_missing" };
  }
  if (row.ownerUserId !== normalized.userId) return { ok: false, errorCode: "openai_conversation_forbidden" };
  return { ok: true, row };
}

async function failCall(err: unknown): Promise<Fail> {
  const mapped = mapOpenAiCallError(err);
  await logServerError("platformOpenAiConversation", { code: mapped.code, requestId: mapped.requestId });
  return { ok: false, errorCode: mapped.code };
}

export async function startPlatformOpenAiConversation(
  input: { actor: OpenAiActor; model: string; instructions?: string | null },
  deps: Deps = defaultDeps(),
): Promise<{ ok: true; conversationId: string } | Fail> {
  const actor = normalizeOpenAiActor(input.actor);
  const model = parseOpenAiModel(input.model);
  const instructions = parseOpenAiInstructions(input.instructions);
  if (!actor || !model || instructions === "invalid") return { ok: false, errorCode: "openai_input_invalid" };
  let openaiConversationId: string;
  try {
    openaiConversationId = await deps.gateway.createConversation();
  } catch (err) {
    return failCall(err);
  }
  const row: OpenAiConversationRecord = {
    id: randomUUID(),
    host: actor.host,
    ownerUserId: actor.userId,
    model,
    openaiConversationId,
    instructions,
    instructionsSent: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
  const inserted = await deps.store.insert(row);
  if (!inserted.ok) return inserted;
  return { ok: true, conversationId: row.id };
}

export async function sendPlatformOpenAiTurn(
  input: { actor: OpenAiActor; conversationId: string; text: string },
  deps: Deps = defaultDeps(),
): Promise<{ ok: true; outputText: string; responseId: string; requestId: string | null } | Fail> {
  const owned = await loadOwned(deps.store, input.actor, input.conversationId);
  if (!owned.ok) return owned;
  const text = parseOpenAiTurnText(input.text);
  if (!text) return { ok: false, errorCode: "openai_input_invalid" };
  const items: OpenAiInputItem[] = [];
  if (owned.row.instructions && !owned.row.instructionsSent) {
    items.push({ role: "developer", content: owned.row.instructions });
  }
  items.push({ role: "user", content: text });
  try {
    const response = await deps.gateway.createResponse({
      model: owned.row.model,
      conversationId: owned.row.openaiConversationId,
      input: items,
    });
    if (!response.outputText.trim()) return { ok: false, errorCode: "openai_empty_output" };
    if (items.some((item) => item.role === "developer")) {
      const marked = await deps.store.markInstructionsSent(owned.row.id);
      if (!marked.ok) return marked;
    }
    await recordTurn(owned.row.ownerUserId, owned.row.id, false);
    return { ok: true, outputText: response.outputText, responseId: response.responseId, requestId: response.requestId };
  } catch (err) {
    return failCall(err);
  }
}

export async function listPlatformOpenAiTurns(
  input: { actor: OpenAiActor; conversationId: string; after?: string },
  deps: Deps = defaultDeps(),
): Promise<{ ok: true; items: OpenAiListedItem[]; hasMore: boolean; lastId: string | null } | Fail> {
  const owned = await loadOwned(deps.store, input.actor, input.conversationId);
  if (!owned.ok) return owned;
  try {
    const page = await deps.gateway.listItems(owned.row.openaiConversationId, input.after);
    const items = page.items.filter((item) => item.role || item.text);
    return { ok: true, items, hasMore: page.hasMore, lastId: page.lastId };
  } catch (err) {
    return failCall(err);
  }
}

export async function listPlatformOpenAiConversations(
  input: { actor: OpenAiActor; page?: number },
  deps: Deps = defaultDeps(),
): Promise<{ ok: true; rows: { id: string; model: string; createdAt: string }[]; total: number } | Fail> {
  const actor = normalizeOpenAiActor(input.actor);
  if (!actor) return { ok: false, errorCode: "openai_conversation_forbidden" };
  const page = Math.max(0, input.page ?? 0);
  const from = page * OPENAI_CONVERSATION_PAGE;
  return deps.store.listActive({ host: actor.host, ownerUserId: actor.userId, from, to: from + OPENAI_CONVERSATION_PAGE - 1 });
}

export async function deletePlatformOpenAiConversation(
  input: { actor: OpenAiActor; conversationId: string },
  deps: Deps = defaultDeps(),
): Promise<{ ok: true } | Fail> {
  const owned = await loadOwned(deps.store, input.actor, input.conversationId);
  if (!owned.ok) return owned;
  try {
    let after: string | undefined;
    do {
      const page = await deps.gateway.listItems(owned.row.openaiConversationId, after);
      for (const item of page.items) {
        await deps.gateway.deleteItem(owned.row.openaiConversationId, item.id);
      }
      after = page.hasMore ? (page.lastId ?? undefined) : undefined;
      if (page.hasMore && !page.lastId) return { ok: false, errorCode: "openai_delete_incomplete" };
    } while (after);
    await deps.gateway.deleteConversation(owned.row.openaiConversationId);
  } catch (err) {
    const mapped = await failCall(err);
    return { ok: false, errorCode: mapped.errorCode === "openai_unavailable" ? "openai_delete_incomplete" : mapped.errorCode };
  }
  const marked = await deps.store.markDeleted(owned.row.id);
  if (!marked.ok) return { ok: false, errorCode: "openai_delete_incomplete" };
  await recordTurn(owned.row.ownerUserId, owned.row.id, true);
  return { ok: true };
}
