import type { LanguageModel } from "@/lib/ai/languageModel";
import type { OpenAiGateway, OpenAiInputItem } from "@/lib/ai/providers/openai/openAiGateway";
import { createOpenAiSdkGateway } from "@/lib/ai/providers/openai/openAiSdkGateway";

function asInput(messages: { role: string; content: string }[]): OpenAiInputItem[] {
  return messages.flatMap((message) =>
    message.role === "developer" || message.role === "user" ? [{ role: message.role, content: message.content }] : [],
  );
}

export function createOpenAiLanguageModel(gateway: OpenAiGateway = createOpenAiSdkGateway()): LanguageModel {
  return {
    kind: "openai",
    memoryMode: "provider_thread",
    listModelIds: () => gateway.listModelIds(),
    openThread: () => gateway.createConversation(),
    async send(input) {
      const response = await gateway.createResponse({
        model: input.model,
        conversationId: input.providerThreadId ?? "",
        input: asInput(input.messages),
      });
      return { outputText: response.outputText, requestId: response.requestId };
    },
    async listThreadItems(providerThreadId, after) {
      return gateway.listItems(providerThreadId, after);
    },
    async eraseThread(providerThreadId) {
      let after: string | undefined;
      do {
        const page = await gateway.listItems(providerThreadId, after);
        for (const item of page.items) await gateway.deleteItem(providerThreadId, item.id);
        if (page.hasMore && !page.lastId) throw new Error("ai_delete_incomplete");
        after = page.hasMore ? (page.lastId ?? undefined) : undefined;
      } while (after);
      await gateway.deleteConversation(providerThreadId);
    },
  };
}
