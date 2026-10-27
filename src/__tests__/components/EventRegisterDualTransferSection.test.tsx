import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EventRegisterDualTransferSection } from "@/components/organisms/EventRegisterDualTransferSection";
import type { EventBankTransferSourcesConfig } from "@/lib/events/eventBankTransferSources";
import en from "@/dictionaries/en.json";

const config: EventBankTransferSourcesConfig = {
  enabled: true,
  mode: "by_question",
  included: ["source_1", "source_2", "global"],
  source1: { label: "Institute A", instructions: "Account A 111" },
  source2: { label: "Institute B", instructions: "Account B 222" },
  globalLabel: "Institute",
  questionPrompt: "Which institute?",
  questionOptions: [
    { id: "a", label: "Institute A", target: "source_1" },
    { id: "both", label: "Both", target: "all" },
  ],
};

function Harness() {
  const [optionId, setOptionId] = useState<string | null>(null);
  const [sourceKey, setSourceKey] = useState<string | null>(null);
  return (
    <EventRegisterDualTransferSection
      config={config}
      bankTransferInstructions={null}
      selectedOptionId={optionId}
      selectedSourceKey={sourceKey}
      onOptionChange={setOptionId}
      onSourceChange={setSourceKey}
      labels={en.events.register.transferSource}
      instructionsTitle={en.events.register.transferInstructions.title}
    />
  );
}

describe("EventRegisterDualTransferSection", () => {
  it("shows the chosen account and asks for a source when the option maps to both", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText("Which institute?")).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Institute A" }));
    expect(screen.getByText("Account A 111")).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: "Both" }));
    expect(screen.getByText(en.events.register.transferSource.chooseSource)).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Institute B" }));
    expect(screen.getByText("Account B 222")).toBeTruthy();
  });
});
