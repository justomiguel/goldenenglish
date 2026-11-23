import { beforeEach, describe, expect, it, vi } from "vitest";

const keyMock = vi.hoisted(() => vi.fn());
const gatewayMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/store/aiProviderStore", () => ({
  loadAiProviderKey: (...args: unknown[]) => keyMock(...args),
}));

vi.mock("@/lib/ai/providers/openai/openAiSdkGateway", () => ({
  createOpenAiSdkGateway: (apiKey: string) => {
    gatewayMock(apiKey);
    return {
      createConversation: async () => "conv_unused",
      createResponse: async () => ({ outputText: "", responseId: "r", requestId: null }),
      listItems: async () => ({ items: [], hasMore: false, lastId: null }),
      deleteItem: async () => undefined,
      deleteConversation: async () => undefined,
      listModelIds: async () => [],
    };
  },
}));

import { modelForProvider } from "@/lib/ai/composeAi";

describe("modelForProvider", () => {
  beforeEach(() => {
    keyMock.mockReset();
    gatewayMock.mockReset();
  });

  it("does not open the OpenAI adapter for a provider this slice does not call", async () => {
    keyMock.mockResolvedValue({ ok: false, errorCode: "ai_provider_unsupported" });
    await expect(modelForProvider("azure-row")).resolves.toEqual({ ok: false, errorCode: "ai_provider_unsupported" });
    expect(gatewayMock).not.toHaveBeenCalled();
  });

  it("opens the OpenAI adapter with the provider key", async () => {
    keyMock.mockResolvedValue({ ok: true, kind: "openai", apiKey: "sk-proj-test-key-value" });
    const model = await modelForProvider("openai-row");
    expect("kind" in model && model.kind).toBe("openai");
    expect(gatewayMock).toHaveBeenCalledWith("sk-proj-test-key-value");
  });
});
