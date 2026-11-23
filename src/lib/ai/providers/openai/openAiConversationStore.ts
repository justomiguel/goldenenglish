export type OpenAiConversationRecord = {
  id: string;
  host: string;
  ownerUserId: string;
  model: string;
  openaiConversationId: string;
  instructions: string | null;
  instructionsSent: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export type OpenAiConversationStore = {
  insert(row: OpenAiConversationRecord): Promise<{ ok: true } | { ok: false; errorCode: string }>;
  findById(id: string): Promise<OpenAiConversationRecord | null>;
  markInstructionsSent(id: string): Promise<{ ok: true } | { ok: false; errorCode: string }>;
  markDeleted(id: string): Promise<{ ok: true } | { ok: false; errorCode: string }>;
  listActive(input: {
    host: string;
    ownerUserId: string;
    from: number;
    to: number;
  }): Promise<{ ok: true; rows: { id: string; model: string; createdAt: string }[]; total: number } | { ok: false; errorCode: string }>;
};
