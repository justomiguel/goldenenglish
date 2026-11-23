import { describe, expect, it, vi } from "vitest";
import { listPlatformOpenAiModelIds } from "@/lib/ai/providers/openai/platformOpenAiModels";
import type { OpenAiGateway } from "@/lib/ai/providers/openai/openAiGateway";

// REGRESSION CHECK: The model list returns at most 40 ids.

describe("listPlatformOpenAiModelIds", () => {
  it("returns at most 40 model ids", async () => {
    const ids = Array.from({ length: 45 }, (_, index) => `model-${index}`);
    const gateway = { listModelIds: vi.fn().mockResolvedValue(ids) } as unknown as OpenAiGateway;
    const result = await listPlatformOpenAiModelIds(gateway);
    expect(result).toEqual({ ok: true, modelIds: ids.slice(0, 40) });
  });
});
