import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import { decryptOpenAiKey, encryptOpenAiKey } from "@/lib/ai/providers/openai/openAiKeyCipher";

// REGRESSION CHECK: The OpenAI cipher prefix stays geoa:v1 so a payment payload cannot decrypt as a key.

describe("openAiKeyCipher", () => {
  it("round-trips a key", () => {
    const secret = randomBytes(32);
    const plain = "sk-proj-test-key-value";
    const enc = encryptOpenAiKey(plain, secret);
    expect(enc.startsWith("geoa:v1:")).toBe(true);
    expect(enc).not.toContain(plain);
    expect(decryptOpenAiKey(enc, secret)).toBe(plain);
  });

  it("rejects a secret that is not 32 bytes", () => {
    expect(() => encryptOpenAiKey("sk-proj-test-key-value", Buffer.alloc(16))).toThrow(
      "openai_encryption_unavailable",
    );
  });

  it("rejects a truncated payload", () => {
    const secret = randomBytes(32);
    const enc = encryptOpenAiKey("sk-proj-test-key-value", secret);
    expect(() => decryptOpenAiKey(enc.slice(0, -4), secret)).toThrow("openai_key_corrupt");
  });
});
