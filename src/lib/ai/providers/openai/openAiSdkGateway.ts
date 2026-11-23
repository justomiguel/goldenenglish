import "server-only";

import OpenAI from "openai";
import { loadConversationProviderKey } from "@/lib/ai/store/aiProviderStore";
import { loadPlatformOpenAiKeyPlain } from "@/lib/ai/providers/openai/platformOpenAiKeyStore";
import { OPENAI_COMPACT_THRESHOLD, type OpenAiGateway, type OpenAiListedItem } from "@/lib/ai/providers/openai/openAiGateway";

async function openClient(apiKey?: string): Promise<OpenAI> {
  if (apiKey) return new OpenAI({ apiKey });
  const bound = await loadConversationProviderKey();
  if (bound.ok) return new OpenAI({ apiKey: bound.apiKey });
  if (bound.errorCode !== "ai_service_unbound" && bound.errorCode !== "not_configured") throw new Error(bound.errorCode);
  const key = await loadPlatformOpenAiKeyPlain();
  if (!key.ok) throw new Error(key.errorCode);
  return new OpenAI({ apiKey: key.apiKey });
}

function listedItem(item: { id?: string; type?: string; role?: string; content?: unknown }): OpenAiListedItem {
  const id = String(item.id ?? "");
  if (item.type === "compaction" || typeof item.role !== "string") return { id, role: null, text: "" };
  if (typeof item.content === "string") return { id, role: item.role, text: item.content };
  if (!Array.isArray(item.content)) return { id, role: item.role, text: "" };
  const text = item.content
    .map((part) => {
      if (!part || typeof part !== "object" || !("text" in part)) return "";
      return typeof part.text === "string" ? part.text : "";
    })
    .filter((line) => line.length > 0)
    .join("\n");
  return { id, role: item.role, text };
}

export function createOpenAiSdkGateway(apiKey?: string): OpenAiGateway {
  return {
    async createConversation() {
      const created = await (await openClient(apiKey)).conversations.create();
      return created.id;
    },
    async createResponse(input) {
      const { data, request_id } = await (await openClient(apiKey)).responses
        .create({
          model: input.model,
          conversation: input.conversationId,
          input: input.input,
          context_management: [{ type: "compaction", compact_threshold: OPENAI_COMPACT_THRESHOLD }],
        })
        .withResponse();
      return {
        outputText: data.output_text ?? "",
        responseId: data.id,
        requestId: request_id,
      };
    },
    async listItems(conversationId, after) {
      const page = await (await openClient(apiKey)).conversations.items.list(conversationId, {
        limit: 100,
        ...(after ? { after } : {}),
      });
      const items = page.data.map((item) => listedItem(item));
      const last = items.at(-1);
      return { items, hasMore: page.has_more, lastId: last?.id ?? null };
    },
    async deleteItem(conversationId, itemId) {
      await (await openClient(apiKey)).conversations.items.delete(itemId, { conversation_id: conversationId });
    },
    async deleteConversation(conversationId) {
      await (await openClient(apiKey)).conversations.delete(conversationId);
    },
    async listModelIds() {
      const page = await (await openClient(apiKey)).models.list();
      return page.data.map((model) => model.id);
    },
  };
}
