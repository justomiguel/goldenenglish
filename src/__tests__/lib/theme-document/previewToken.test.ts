import { describe, expect, it } from "vitest";
import { previewSigningKey, signPreviewToken, verifyPreviewToken } from "@/lib/theme-document/previewToken";

const payload = { tenantSlug: "golden", draftId: "draft-1", exp: 2_000 };

async function key(secret: string): Promise<CryptoKey> {
  return previewSigningKey(secret);
}

describe("previewToken", () => {
  it("verifies a token signed with the same key", async () => {
    const signingKey = await key("secret-a");
    const token = await signPreviewToken(payload, signingKey);
    const result = await verifyPreviewToken(token, signingKey, 1_000);
    expect(result).toEqual({ ok: true, tenantSlug: "golden", draftId: "draft-1" });
  });

  it("rejects a tampered payload", async () => {
    const signingKey = await key("secret-a");
    const token = await signPreviewToken(payload, signingKey);
    const [body, signature] = token.split(".");
    const tampered = `${body?.slice(0, -2)}aa.${signature}`;
    const result = await verifyPreviewToken(tampered, signingKey, 1_000);
    expect(result).toEqual({ ok: false, code: "preview_token_invalid" });
  });

  it("rejects a token checked with a different key", async () => {
    const token = await signPreviewToken(payload, await key("secret-a"));
    const result = await verifyPreviewToken(token, await key("secret-b"), 1_000);
    expect(result).toEqual({ ok: false, code: "preview_token_invalid" });
  });

  it("rejects an expired token", async () => {
    const signingKey = await key("secret-a");
    const token = await signPreviewToken(payload, signingKey);
    const result = await verifyPreviewToken(token, signingKey, 2_000);
    expect(result).toEqual({ ok: false, code: "preview_token_invalid" });
  });
});
