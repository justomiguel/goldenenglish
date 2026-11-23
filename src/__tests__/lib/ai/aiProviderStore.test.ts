import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.hoisted(() => vi.fn());
const configured = vi.hoisted(() => vi.fn(() => true));

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: configured,
  createPulsarAdminClient: () => ({
    from(table: string) {
      return {
        insert: (row: unknown) => {
          insert(table, row);
          return Promise.resolve({ error: null });
        },
        upsert: (row: unknown) => {
          insert(table, row);
          return Promise.resolve({ error: null });
        },
      };
    },
  }),
}));

import { saveAiProvider } from "@/lib/ai/store/aiProviderStore";

const actor = { actorUserId: "00000000-0000-4000-8000-000000000001", actorEmail: "admin@centrolisto.cl" };
const fixture = "sk-proj-test-key-value";

// REGRESSION CHECK: The provider row stores ciphertext. Azure is refused before a write.

describe("saveAiProvider", () => {
  beforeEach(() => {
    insert.mockReset();
    configured.mockReset();
    configured.mockReturnValue(true);
    process.env.AI_KEY_ENCRYPTION_SECRET = Buffer.alloc(32, 5).toString("base64");
  });

  it("writes geai ciphertext and binds conversations", async () => {
    const result = await saveAiProvider({ ...actor, kind: "openai", apiKey: fixture });
    expect(result.ok).toBe(true);
    const provider = insert.mock.calls.find((call) => call[0] === "platform_ai_providers")?.[1] as { api_key_cipher: string };
    expect(provider.api_key_cipher.startsWith("geai:v1:")).toBe(true);
    expect(provider.api_key_cipher).not.toContain(fixture);
    expect(JSON.stringify(insert.mock.calls)).not.toContain(fixture);
    expect(insert.mock.calls.some((call) => call[0] === "platform_ai_service_bindings")).toBe(true);
  });

  it("does not write an Azure provider in this slice", async () => {
    await expect(saveAiProvider({ ...actor, kind: "azure", apiKey: fixture })).resolves.toEqual({
      ok: false,
      errorCode: "ai_provider_unsupported",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a bad key, a missing secret, and a missing database", async () => {
    await expect(saveAiProvider({ ...actor, kind: "openai", apiKey: "nope" })).resolves.toEqual({
      ok: false,
      errorCode: "ai_key_invalid",
    });
    delete process.env.AI_KEY_ENCRYPTION_SECRET;
    delete process.env.OPENAI_KEY_ENCRYPTION_SECRET;
    await expect(saveAiProvider({ ...actor, kind: "openai", apiKey: fixture })).resolves.toEqual({
      ok: false,
      errorCode: "ai_encryption_unavailable",
    });
    process.env.AI_KEY_ENCRYPTION_SECRET = Buffer.alloc(32, 5).toString("base64");
    configured.mockReturnValue(false);
    await expect(saveAiProvider({ ...actor, kind: "openai", apiKey: fixture })).resolves.toEqual({
      ok: false,
      errorCode: "not_configured",
    });
    expect(insert).not.toHaveBeenCalled();
  });
});
