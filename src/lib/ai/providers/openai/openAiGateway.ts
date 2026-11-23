export const OPENAI_COMPACT_THRESHOLD = 200_000;

export type OpenAiInputItem = { role: "developer" | "user"; content: string };

export type OpenAiListedItem = { id: string; role: string | null; text: string };

export type OpenAiGateway = {
  createConversation(): Promise<string>;
  createResponse(input: {
    model: string;
    conversationId: string;
    input: OpenAiInputItem[];
  }): Promise<{ outputText: string; responseId: string; requestId: string | null }>;
  listItems(
    conversationId: string,
    after?: string,
  ): Promise<{ items: OpenAiListedItem[]; hasMore: boolean; lastId: string | null }>;
  deleteItem(conversationId: string, itemId: string): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;
  listModelIds(): Promise<string[]>;
};
