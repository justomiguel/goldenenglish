import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";

const { refreshMock, saveMock, clearMock, testMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  saveMock: vi.fn(),
  clearMock: vi.fn(),
  testMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/app/[locale]/admin/openAiKeyAction", () => ({
  savePlatformOpenAiKeyAction: (...args: unknown[]) => saveMock(...args),
  clearPlatformOpenAiKeyAction: (...args: unknown[]) => clearMock(...args),
  testPlatformOpenAiModelsAction: (...args: unknown[]) => testMock(...args),
}));

import { PulsarAdminOpenAiKey } from "@/components/organisms/pulsar/PulsarAdminOpenAiKey";

const copy = en.pulsar.admin.openai;

// REGRESSION CHECK: The key field stays empty. The screen shows the last 4, model ids, and the error code.

describe("PulsarAdminOpenAiKey", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    saveMock.mockReset();
    clearMock.mockReset();
    testMock.mockReset();
  });

  it("shows the last 4 and keeps the key field empty", () => {
    render(<PulsarAdminOpenAiKey locale="en" saved last4="alue" copy={copy} />);
    expect(screen.getByText(/Last 4: alue/)).toBeTruthy();
    const field = screen.getByLabelText(copy.keyLabel) as HTMLInputElement;
    expect(field.value).toBe("");
    expect(screen.getByText(copy.providersEmpty)).toBeTruthy();
  });

  it("lists the saved provider and the conversation binding", () => {
    render(
      <PulsarAdminOpenAiKey
        locale="en"
        saved
        last4="alue"
        providers={[{ id: "p1", label: "OpenAI", enabled: true, last4: "alue" }]}
        conversationProviderId="p1"
        copy={copy}
      />,
    );
    expect(screen.getByRole("list", { name: copy.providersTitle }).textContent).toContain("OpenAI");
    expect(screen.getByRole("list", { name: copy.providersTitle }).textContent).toContain(copy.providerBound);
  });

  it("lists model ids from the test action", async () => {
    testMock.mockResolvedValue({ ok: true, modelIds: ["gpt-test"] });
    const user = userEvent.setup();
    render(<PulsarAdminOpenAiKey locale="en" saved={false} last4={null} copy={copy} />);
    await user.click(screen.getByRole("button", { name: copy.test }));
    expect(await screen.findByText("gpt-test")).toBeTruthy();
  });

  it("shows the error code when the test fails", async () => {
    testMock.mockResolvedValue({ ok: false, errorCode: "openai_key_rejected" });
    const user = userEvent.setup();
    render(<PulsarAdminOpenAiKey locale="en" saved={false} last4={null} copy={copy} />);
    await user.click(screen.getByRole("button", { name: copy.test }));
    expect(await screen.findByText(/openai_key_rejected/)).toBeTruthy();
  });
});
