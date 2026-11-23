export type AiProviderKind = "openai" | "azure";

export type MemoryMode = "provider_thread" | "system_log";

export type AiMessage = { role: "developer" | "user" | "assistant"; content: string };

export type AiListedTurn = { id: string; role: string | null; text: string };

export type LanguageModel = {
  kind: AiProviderKind;
  memoryMode: MemoryMode;
  listModelIds(): Promise<string[]>;
  openThread(): Promise<string | null>;
  send(input: { model: string; messages: AiMessage[]; providerThreadId: string | null }): Promise<{ outputText: string; requestId: string | null }>;
  eraseThread(providerThreadId: string): Promise<void>;
  listThreadItems(providerThreadId: string, after?: string): Promise<{ items: AiListedTurn[]; hasMore: boolean; lastId: string | null }>;
};
