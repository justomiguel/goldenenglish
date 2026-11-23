import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiCatalog, AiProviderRecord, AiThread, AiThreadStore, AiTurnStore } from "@/lib/ai/aiStores";
import type { LanguageModel } from "@/lib/ai/languageModel";
import type { LogTurn } from "@/lib/ai/systemLogWindow";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { deleteConversation } from "@/lib/ai/deleteConversation";
import { sendTurn } from "@/lib/ai/sendTurn";
import { startConversation } from "@/lib/ai/startConversation";

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(async () => ({ ok: true })),
}));

const actor = { host: "CentroListo.cl", userId: "00000000-0000-4000-8000-000000000001" };

// REGRESSION CHECK: A provider without a thread API still remembers the turn. A native thread does not replay earlier text.

function provider(): AiProviderRecord {
  return { id: "provider-1", kind: "openai", label: "OpenAI", enabled: true, endpoint: null };
}

function threads(): AiThreadStore & { rows: AiThread[] } {
  const rows: AiThread[] = [];
  return {
    rows,
    async insert(row) {
      rows.push(row);
      return { ok: true };
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async markInstructionsSent(id) {
      const row = rows.find((item) => item.id === id);
      if (row) row.instructionsSent = true;
      return { ok: true };
    },
    async markDeleted(id) {
      const row = rows.find((item) => item.id === id);
      if (row) row.deletedAt = "deleted";
      return { ok: true };
    },
  };
}

function turnStore(): AiTurnStore & { rows: (LogTurn & { threadId: string })[] } {
  const rows: (LogTurn & { threadId: string })[] = [];
  return {
    rows,
    async list(threadId) {
      return rows.filter((row) => row.threadId === threadId);
    },
    async insert(threadId, turn) {
      rows.push({ ...turn, threadId });
      return { ok: true };
    },
    async fold(ids, at) {
      for (const row of rows) {
        if (ids.includes(row.id)) row.foldedAt = at;
      }
      return { ok: true };
    },
    async erase(threadId) {
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (rows[index]?.threadId === threadId) rows.splice(index, 1);
      }
      return { ok: true };
    },
  };
}

function model(mode: LanguageModel["memoryMode"], failFold = false): LanguageModel & { sends: { messages: { content: string }[]; providerThreadId: string | null }[] } {
  const sends: { messages: { content: string }[]; providerThreadId: string | null }[] = [];
  return {
    sends,
    kind: "openai",
    memoryMode: mode,
    async listModelIds() {
      return ["gpt-test"];
    },
    async openThread() {
      return mode === "provider_thread" ? "conv_secret" : null;
    },
    async send(input) {
      sends.push({ messages: input.messages, providerThreadId: input.providerThreadId });
      if (failFold && input.messages.some((message) => message.content.startsWith("Summarize"))) {
        throw new Error("fold failed");
      }
      return { outputText: input.messages.some((message) => message.content.startsWith("Summarize")) ? "short summary" : "answer", requestId: "req_1" };
    },
    async eraseThread() {},
    async listThreadItems() {
      return { items: [], hasMore: false, lastId: null };
    },
  };
}

function deps(mode: LanguageModel["memoryMode"], failFold = false) {
  const language = model(mode, failFold);
  const catalog: AiCatalog = { async binding() { return provider(); } };
  return { catalog, threads: threads(), turns: turnStore(), language, modelFor: async () => language };
}

describe("conversation use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps a system log when the provider has no thread id", async () => {
    const kit = deps("system_log");
    const started = await startConversation({ actor, model: "gpt-test" }, kit);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(kit.threads.rows[0]?.providerThreadId).toBeNull();
    await sendTurn({ actor, threadId: started.threadId, text: "first" }, kit);
    const second = await sendTurn({ actor, threadId: started.threadId, text: "second" }, kit);
    expect(second).toEqual({ ok: true, outputText: "answer", requestId: "req_1" });
    const last = kit.language.sends.at(-1);
    expect(last?.providerThreadId).toBeNull();
    expect(last?.messages.map((message) => message.content)).toContain("first");
    expect(last?.messages.map((message) => message.content)).toContain("second");
    expect(JSON.stringify(started)).not.toContain("conv_");
  });

  it("does not send the unfolded history when the summary call fails", async () => {
    const kit = deps("system_log", true);
    const started = await startConversation({ actor, model: "gpt-test" }, kit);
    if (!started.ok) throw new Error("start");
    await kit.turns.insert(started.threadId, { id: "old", role: "user", body: "x".repeat(24_001), foldedAt: null });
    const result = await sendTurn({ actor, threadId: started.threadId, text: "next" }, kit);
    expect(result).toEqual({ ok: false, errorCode: "ai_compaction_failed" });
    expect(kit.language.sends.some((call) => call.messages.some((message) => message.content === "next"))).toBe(false);
  });

  it("sends only the new user text on a provider thread", async () => {
    const kit = deps("provider_thread");
    const started = await startConversation({ actor, model: "gpt-test", instructions: "Be brief." }, kit);
    if (!started.ok) throw new Error("start");
    await sendTurn({ actor, threadId: started.threadId, text: "first" }, kit);
    await sendTurn({ actor, threadId: started.threadId, text: "second" }, kit);
    const last = kit.language.sends.at(-1);
    expect(last?.providerThreadId).toBe("conv_secret");
    expect(last?.messages).toEqual([{ role: "user", content: "second" }]);
    expect(JSON.stringify(started)).not.toContain("conv_secret");
  });

  it("returns ai_provider_disabled when the bound provider is off", async () => {
    const kit = deps("provider_thread");
    kit.catalog.binding = async () => ({ ...provider(), enabled: false });
    await expect(startConversation({ actor, model: "gpt-test" }, kit)).resolves.toEqual({
      ok: false,
      errorCode: "ai_provider_disabled",
    });
  });

  it("removes system-log turns and marks the thread deleted", async () => {
    const kit = deps("system_log");
    const started = await startConversation({ actor, model: "gpt-test" }, kit);
    if (!started.ok) throw new Error("start");
    await sendTurn({ actor, threadId: started.threadId, text: "first" }, kit);
    await deleteConversation({ actor, threadId: started.threadId }, kit);
    expect(kit.turns.rows).toEqual([]);
    expect(kit.threads.rows[0]?.deletedAt).toBe("deleted");
  });

  it("refuses Azure and a model that cannot be opened", async () => {
    const kit = deps("provider_thread");
    kit.catalog.binding = async () => ({ ...provider(), kind: "azure" });
    await expect(startConversation({ actor, model: "gpt-test" }, kit)).resolves.toEqual({
      ok: false,
      errorCode: "ai_provider_unsupported",
    });
    kit.catalog.binding = async () => provider();
    kit.modelFor = async () => ({ ok: false, errorCode: "ai_key_missing" });
    await expect(startConversation({ actor, model: "gpt-test" }, kit)).resolves.toEqual({
      ok: false,
      errorCode: "ai_key_missing",
    });
  });

  it("returns the store error when the thread insert fails", async () => {
    const kit = deps("system_log");
    kit.threads.insert = async () => ({ ok: false, errorCode: "ai_unavailable" });
    await expect(startConversation({ actor, model: "gpt-test" }, kit)).resolves.toEqual({
      ok: false,
      errorCode: "ai_unavailable",
    });
  });

  it("returns ai_empty_output when the model reply is blank", async () => {
    const kit = deps("provider_thread");
    const started = await startConversation({ actor, model: "gpt-test" }, kit);
    if (!started.ok) throw new Error("start");
    kit.language.send = async () => ({ outputText: "   ", requestId: "req_blank" });
    await expect(sendTurn({ actor, threadId: started.threadId, text: "hello" }, kit)).resolves.toEqual({
      ok: false,
      errorCode: "ai_empty_output",
    });
  });

  it("keeps the turn when the analytics write fails", async () => {
    vi.mocked(recordUserEventServer).mockResolvedValueOnce({ ok: false });
    const kit = deps("provider_thread");
    const started = await startConversation({ actor, model: "gpt-test" }, kit);
    if (!started.ok) throw new Error("start");
    await expect(sendTurn({ actor, threadId: started.threadId, text: "hello" }, kit)).resolves.toEqual({
      ok: true,
      outputText: "answer",
      requestId: "req_1",
    });
  });
});
