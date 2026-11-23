import type { AiProviderKind, MemoryMode } from "@/lib/ai/languageModel";
import type { LogTurn } from "@/lib/ai/systemLogWindow";

export type AiProviderRecord = {
  id: string;
  kind: AiProviderKind;
  label: string;
  enabled: boolean;
  endpoint: string | null;
};

export type AiThread = {
  id: string;
  service: string;
  host: string;
  ownerUserId: string;
  providerId: string;
  memoryMode: MemoryMode;
  model: string;
  providerThreadId: string | null;
  instructions: string | null;
  instructionsSent: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export type AiFail = { ok: false; errorCode: string };

export type AiThreadStore = {
  insert(row: AiThread): Promise<{ ok: true } | AiFail>;
  findById(id: string): Promise<AiThread | null>;
  markInstructionsSent(id: string): Promise<{ ok: true } | AiFail>;
  markDeleted(id: string): Promise<{ ok: true } | AiFail>;
};

export type AiTurnStore = {
  list(threadId: string): Promise<LogTurn[]>;
  insert(threadId: string, turn: LogTurn): Promise<{ ok: true } | AiFail>;
  fold(ids: readonly string[], at: string): Promise<{ ok: true } | AiFail>;
  erase(threadId: string): Promise<{ ok: true } | AiFail>;
};

export type AiCatalog = {
  binding(service: string): Promise<AiProviderRecord | null>;
};
