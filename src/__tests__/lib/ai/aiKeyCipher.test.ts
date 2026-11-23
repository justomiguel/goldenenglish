import { describe, expect, it } from "vitest";
import { encryptOpenAiKey } from "@/lib/ai/providers/openai/openAiKeyCipher";
import { decryptAiKey, encryptAiKey } from "@/lib/ai/aiKeyCipher";

const secret = Buffer.alloc(32, 9);

// REGRESSION CHECK: New keys use geai:v1. A stored geoa:v1 payload still decrypts.

describe("aiKeyCipher", () => {
  it("round-trips geai and still opens geoa", () => {
    const cipher = encryptAiKey("sk-proj-test-key-value", secret);
    expect(cipher.startsWith("geai:v1:")).toBe(true);
    expect(decryptAiKey(cipher, secret)).toBe("sk-proj-test-key-value");
    const legacy = encryptOpenAiKey("sk-proj-test-key-value", secret);
    expect(decryptAiKey(legacy, secret)).toBe("sk-proj-test-key-value");
  });

  it("rejects a truncated payload and a wrong key", () => {
    const cipher = encryptAiKey("sk-proj-test-key-value", secret);
    expect(() => decryptAiKey(cipher.slice(0, 20), secret)).toThrow("ai_key_corrupt");
    expect(() => decryptAiKey(cipher, Buffer.alloc(32, 3))).toThrow("ai_key_corrupt");
  });
});
