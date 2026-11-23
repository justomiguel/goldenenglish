import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const updateEq = vi.hoisted(() => vi.fn());
const insert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => true,
  createPulsarAdminClient: () => ({
    from(table: string) {
      if (table === "platform_audit_log") return { insert };
      return {
        select: () => ({ eq: () => ({ maybeSingle }) }),
        update: (patch: unknown) => {
          update(patch);
          return { eq: updateEq };
        },
      };
    },
  }),
}));

import { savePlatformOpenAiKey } from "@/lib/ai/providers/openai/platformOpenAiKeyStore";

const actor = { actorUserId: "00000000-0000-0000-0000-000000000001", actorEmail: "admin@centrolisto.cl" };
const fixture = "sk-proj-test-key-value";

// REGRESSION CHECK: A saved OpenAI key is ciphertext. The audit row and the result omit the key.

describe("savePlatformOpenAiKey", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    update.mockReset();
    updateEq.mockReset();
    insert.mockReset();
    updateEq.mockResolvedValue({ error: null });
    insert.mockResolvedValue({ error: null });
    process.env.OPENAI_KEY_ENCRYPTION_SECRET = Buffer.alloc(32, 7).toString("base64");
  });

  it("writes ciphertext and the last 4, and does not return the key", async () => {
    const result = await savePlatformOpenAiKey({ ...actor, apiKey: `  ${fixture}  ` });
    expect(result).toEqual({ ok: true, last4: "alue" });
    const patch = update.mock.calls[0]?.[0] as { openai_api_key_cipher: string; openai_api_key_last4: string };
    expect(patch.openai_api_key_last4).toBe("alue");
    expect(patch.openai_api_key_cipher.startsWith("geoa:v1:")).toBe(true);
    expect(patch.openai_api_key_cipher).not.toContain(fixture);
    expect(JSON.stringify(result)).not.toContain(fixture);
    const audit = insert.mock.calls[0]?.[0] as { changed_fields: string[] };
    expect(audit.changed_fields).toEqual(["openai_api_key_cipher", "openai_api_key_last4"]);
    expect(JSON.stringify(audit)).not.toContain(fixture);
  });

  it("does not write when the encryption secret is missing", async () => {
    delete process.env.OPENAI_KEY_ENCRYPTION_SECRET;
    delete process.env.AI_KEY_ENCRYPTION_SECRET;
    await expect(savePlatformOpenAiKey({ ...actor, apiKey: fixture })).resolves.toEqual({
      ok: false,
      errorCode: "openai_encryption_unavailable",
    });
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("saves the key when the audit write fails", async () => {
    insert.mockResolvedValue({ error: { message: "audit down" } });
    const saved = await savePlatformOpenAiKey({ ...actor, apiKey: fixture });
    expect(saved.ok).toBe(true);
  });
});
