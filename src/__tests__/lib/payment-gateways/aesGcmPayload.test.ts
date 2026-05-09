import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import { decryptAesGcmUtf8, encryptAesGcmUtf8 } from "@/lib/payment-gateways/aesGcmPayload";

describe("aesGcmPayload", () => {
  it("round-trips UTF-8 plaintext", () => {
    const key = randomBytes(32);
    const plain = "hello unicode 世界";
    const enc = encryptAesGcmUtf8(plain, key);
    expect(enc.startsWith("gegw:v1:")).toBe(true);
    expect(decryptAesGcmUtf8(enc, key)).toBe(plain);
  });

  it("rejects wrong key length", () => {
    expect(() => encryptAesGcmUtf8("x", Buffer.alloc(16))).toThrow(
      "payment_gateway_encryption_key_must_be_32_bytes",
    );
  });

  it("rejects tampered or invalid payload", () => {
    const key = randomBytes(32);
    const enc = encryptAesGcmUtf8("a", key);
    expect(() => decryptAesGcmUtf8(enc.slice(0, -4), key)).toThrow();
    expect(() => decryptAesGcmUtf8("not:our:format", key)).toThrow("invalid_payment_gateway_payload");
  });
});
