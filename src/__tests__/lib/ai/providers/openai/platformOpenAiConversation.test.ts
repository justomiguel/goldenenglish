import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenAiConversationRecord, OpenAiConversationStore } from "@/lib/ai/providers/openai/openAiConversationStore";
import type { OpenAiGateway, OpenAiInputItem } from "@/lib/ai/providers/openai/openAiGateway";
import {
  deletePlatformOpenAiConversation,
  sendPlatformOpenAiTurn,
  startPlatformOpenAiConversation,
} from "@/lib/ai/providers/openai/platformOpenAiConversation";

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(async () => ({ ok: true })),
}));

const actor = { host: "centrolisto.cl", userId: "00000000-0000-0000-0000-000000000001" };

// REGRESSION CHECK: A later turn must not resend earlier text. Delete must not mark the row when an item delete fails.

function memoryStore(): OpenAiConversationStore & { rows: OpenAiConversationRecord[] } {
  const rows: OpenAiConversationRecord[] = [];
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
    async listActive() {
      return { ok: true, rows: [], total: 0 };
    },
  };
}

function gateway(failDelete = false): OpenAiGateway & { calls: OpenAiInputItem[][]; order: string[] } {
  const calls: OpenAiInputItem[][] = [];
  const order: string[] = [];
  return {
    calls,
    order,
    async createConversation() {
      return "conv_secret";
    },
    async createResponse(input) {
      calls.push(input.input);
      if (input.model === "missing") {
        const err = new Error("no") as Error & { status?: number; request_id?: string };
        err.status = 401;
        err.request_id = "req_401";
        throw err;
      }
      if (input.model === "slow") {
        const err = new Error("slow") as Error & { status?: number };
        err.status = 429;
        throw err;
      }
      if (input.model === "odd") {
        const err = new Error("odd") as Error & { status?: number };
        err.status = 418;
        throw err;
      }
      if (input.model === "blank") return { outputText: "   ", responseId: "resp_blank", requestId: "req_blank" };
      return { outputText: "answer", responseId: "resp_1", requestId: "req_1" };
    },
    async listItems() {
      order.push("list");
      return {
        items: [
          { id: "msg_1", role: "user", text: "first" },
          { id: "msg_2", role: "assistant", text: "answer" },
        ],
        hasMore: false,
        lastId: "msg_2",
      };
    },
    async deleteItem(_conversationId, itemId) {
      order.push(`item:${itemId}`);
      if (failDelete && itemId === "msg_2") throw new Error("stop");
    },
    async deleteConversation() {
      order.push("conversation");
    },
    async listModelIds() {
      return [];
    },
  };
}

describe("platform OpenAI conversation", () => {
  let store: ReturnType<typeof memoryStore>;

  beforeEach(() => {
    store = memoryStore();
  });

  it("stores a pointer and does not return the OpenAI conversation id", async () => {
    const result = await startPlatformOpenAiConversation(
      { actor, model: "gpt-test", instructions: "Be brief." },
      { store, gateway: gateway() },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.conversationId).not.toContain("conv_");
    expect(store.rows[0]?.openaiConversationId).toBe("conv_secret");
  });

  it("sends instructions once and only the new text on the next turn", async () => {
    const port = gateway();
    const started = await startPlatformOpenAiConversation(
      { actor, model: "gpt-test", instructions: "Be brief." },
      { store, gateway: port },
    );
    if (!started.ok) throw new Error("start");
    await sendPlatformOpenAiTurn(
      { actor, conversationId: started.conversationId, text: "first question" },
      { store, gateway: port },
    );
    await sendPlatformOpenAiTurn(
      { actor, conversationId: started.conversationId, text: "second question" },
      { store, gateway: port },
    );
    expect(port.calls[0]).toEqual([
      { role: "developer", content: "Be brief." },
      { role: "user", content: "first question" },
    ]);
    expect(port.calls[1]).toEqual([{ role: "user", content: "second question" }]);
    expect(JSON.stringify(port.calls[1])).not.toContain("first question");
  });

  it("deletes each item before the conversation and keeps the row when an item delete fails", async () => {
    const started = await startPlatformOpenAiConversation(
      { actor, model: "gpt-test" },
      { store, gateway: gateway() },
    );
    if (!started.ok) throw new Error("start");
    const failing = gateway(true);
    const failed = await deletePlatformOpenAiConversation(
      { actor, conversationId: started.conversationId },
      { store, gateway: failing },
    );
    expect(failed).toEqual({ ok: false, errorCode: "openai_delete_incomplete" });
    expect(store.rows[0]?.deletedAt).toBeNull();
    expect(failing.order).toEqual(["list", "item:msg_1", "item:msg_2"]);

    const okPort = gateway();
    const removed = await deletePlatformOpenAiConversation(
      { actor, conversationId: started.conversationId },
      { store, gateway: okPort },
    );
    expect(removed).toEqual({ ok: true });
    expect(okPort.order).toEqual(["list", "item:msg_1", "item:msg_2", "conversation"]);
    expect(store.rows[0]?.deletedAt).not.toBeNull();
  });

  it("maps 401, 429, and an unmapped status", async () => {
    for (const [model, code] of [
      ["missing", "openai_key_rejected"],
      ["slow", "openai_rate_limited"],
      ["odd", "418"],
    ] as const) {
      const started = await startPlatformOpenAiConversation({ actor, model }, { store, gateway: gateway() });
      if (!started.ok) throw new Error("start");
      await expect(
        sendPlatformOpenAiTurn(
          { actor, conversationId: started.conversationId, text: "hello" },
          { store, gateway: gateway() },
        ),
      ).resolves.toEqual({ ok: false, errorCode: code });
    }
  });

  it("returns openai_empty_output when the reply is blank", async () => {
    const started = await startPlatformOpenAiConversation({ actor, model: "blank" }, { store, gateway: gateway() });
    if (!started.ok) throw new Error("start");
    await expect(
      sendPlatformOpenAiTurn({ actor, conversationId: started.conversationId, text: "hello" }, { store, gateway: gateway() }),
    ).resolves.toEqual({ ok: false, errorCode: "openai_empty_output" });
  });

  it("stops a delete that has another page and no cursor", async () => {
    const started = await startPlatformOpenAiConversation({ actor, model: "gpt-test" }, { store, gateway: gateway() });
    if (!started.ok) throw new Error("start");
    const port = gateway();
    port.listItems = async () => ({ items: [], hasMore: true, lastId: null });
    await expect(
      deletePlatformOpenAiConversation({ actor, conversationId: started.conversationId }, { store, gateway: port }),
    ).resolves.toEqual({ ok: false, errorCode: "openai_delete_incomplete" });
    expect(store.rows[0]?.deletedAt).toBeNull();
  });

  it("keeps the vendor thread when the local delete mark fails", async () => {
    const started = await startPlatformOpenAiConversation({ actor, model: "gpt-test" }, { store, gateway: gateway() });
    if (!started.ok) throw new Error("start");
    store.markDeleted = async () => ({ ok: false, errorCode: "openai_unavailable" });
    await expect(
      deletePlatformOpenAiConversation({ actor, conversationId: started.conversationId }, { store, gateway: gateway() }),
    ).resolves.toEqual({ ok: false, errorCode: "openai_delete_incomplete" });
  });
});
