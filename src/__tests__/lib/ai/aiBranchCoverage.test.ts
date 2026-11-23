import { afterEach, describe, expect, it } from "vitest";
import { mapOpenAiCallError } from "@/lib/ai/providers/openai/mapOpenAiCallError";
import { parseOpenAiInstructions } from "@/lib/ai/providers/openai/openAiTurnRules";
import { latestSummary, windowChars } from "@/lib/ai/systemLogWindow";
import { mapAiCallError } from "@/lib/ai/aiError";
import { decryptAiKey, encryptAiKey } from "@/lib/ai/aiKeyCipher";
import { normalizeAiActor, parseAiInstructions, parseAiModel, parseAiTurnText } from "@/lib/ai/conversationRules";
import { loadOwnedThread } from "@/lib/ai/loadOwnedThread";
import { readAiEncryptionSecret } from "@/lib/ai/readAiEncryptionSecret";
import type { AiThreadStore } from "@/lib/ai/aiStores";

const owner = "00000000-0000-4000-8000-000000000001";

describe("mapAiCallError", () => {
  it("keeps an ai_ code and maps each OpenAI name", () => {
    expect(mapAiCallError(new Error("ai_custom"))).toEqual({ code: "ai_custom", requestId: null });
    expect(mapAiCallError(new Error("openai_key_rejected")).code).toBe("ai_key_rejected");
    expect(mapAiCallError(new Error("not_a_code"))).toEqual({ code: "ai_unavailable", requestId: null });
    expect(mapAiCallError(null)).toEqual({ code: "ai_unavailable", requestId: null });
  });

  it("maps HTTP status and keeps the vendor request id", () => {
    expect(mapAiCallError({ status: 401, request_id: "req_1" })).toEqual({ code: "ai_key_rejected", requestId: "req_1" });
    expect(mapAiCallError({ status: 403, requestID: "req_2" }).code).toBe("ai_forbidden");
    expect(mapAiCallError({ status: 404 }).code).toBe("ai_model_not_found");
    expect(mapAiCallError({ status: 429 }).code).toBe("ai_rate_limited");
    expect(mapAiCallError({ status: 418, request_id: 12 }).code).toBe("418");
    expect(mapAiCallError({ status: "401" }).code).toBe("ai_unavailable");
  });
});

describe("provider error and window edges", () => {
  it("maps the remaining HTTP statuses and an empty window", () => {
    expect(mapOpenAiCallError({ status: 403 }).code).toBe("openai_forbidden");
    expect(mapOpenAiCallError({ status: 404 }).code).toBe("openai_model_not_found");
    expect(parseOpenAiInstructions("   ")).toBeNull();
    expect(parseOpenAiInstructions("i".repeat(8001))).toBe("invalid");
    expect(latestSummary([{ id: "u", role: "user", body: "hi", foldedAt: null }])).toBeNull();
    expect(latestSummary([{ id: "s", role: "summary", body: "old", foldedAt: "done" }])).toBeNull();
    expect(windowChars([{ id: "u", role: "user", body: "ab", foldedAt: null }], "")).toBe(2);
  });
});

describe("conversation rules", () => {
  it("rejects a blank host, a long model, a long turn, and bad instructions", () => {
    expect(normalizeAiActor({ host: "  ", userId: owner })).toBeNull();
    expect(parseAiModel("   ")).toBeNull();
    expect(parseAiModel("m".repeat(81))).toBeNull();
    expect(parseAiTurnText("")).toBeNull();
    expect(parseAiTurnText("t".repeat(32001))).toBeNull();
    expect(parseAiInstructions("   ")).toBeNull();
    expect(parseAiInstructions(undefined)).toBeNull();
    expect(parseAiInstructions("i".repeat(8001))).toBe("invalid");
  });
});

describe("loadOwnedThread", () => {
  const store: AiThreadStore = {
    async insert() {
      return { ok: true };
    },
    async findById() {
      return {
        id: "thread-1",
        service: "conversation",
        host: "other.example",
        ownerUserId: "00000000-0000-4000-8000-000000000002",
        providerId: "p1",
        memoryMode: "system_log",
        model: "gpt-test",
        providerThreadId: null,
        instructions: null,
        instructionsSent: false,
        deletedAt: "gone",
        createdAt: "2026-11-21T00:00:00.000Z",
      };
    },
    async markInstructionsSent() {
      return { ok: true };
    },
    async markDeleted() {
      return { ok: true };
    },
  };

  it("rejects a bad actor and a deleted thread on another host", async () => {
    const bad = await loadOwnedThread(store, { host: "", userId: "nope" }, "thread-1");
    expect(bad).toEqual({ ok: false, errorCode: "ai_thread_forbidden" });
    const missing = await loadOwnedThread(store, { host: "centrolisto.cl", userId: owner }, "thread-1");
    expect(missing).toEqual({ ok: false, errorCode: "ai_thread_missing" });
  });
});

describe("AI key cipher branches", () => {
  it("rejects a short secret", () => {
    const short = Buffer.alloc(16, 1);
    expect(() => encryptAiKey("sk-proj-test-key-value", short)).toThrow("ai_encryption_unavailable");
    expect(() => decryptAiKey("geai:v1:aa:bb:cc", short)).toThrow("ai_encryption_unavailable");
    expect(() => decryptAiKey("nope", Buffer.alloc(32, 2))).toThrow("ai_key_corrupt");
  });
});

describe("readAiEncryptionSecret", () => {
  const previousAi = process.env.AI_KEY_ENCRYPTION_SECRET;
  const previousOpenAi = process.env.OPENAI_KEY_ENCRYPTION_SECRET;

  afterEach(() => {
    if (previousAi === undefined) delete process.env.AI_KEY_ENCRYPTION_SECRET;
    else process.env.AI_KEY_ENCRYPTION_SECRET = previousAi;
    if (previousOpenAi === undefined) delete process.env.OPENAI_KEY_ENCRYPTION_SECRET;
    else process.env.OPENAI_KEY_ENCRYPTION_SECRET = previousOpenAi;
  });

  it("returns null when the decoded secret is not 32 bytes", () => {
    process.env.AI_KEY_ENCRYPTION_SECRET = Buffer.alloc(8, 3).toString("base64");
    delete process.env.OPENAI_KEY_ENCRYPTION_SECRET;
    expect(readAiEncryptionSecret()).toBeNull();
  });
});
