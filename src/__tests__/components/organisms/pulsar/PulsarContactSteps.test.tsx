import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { PulsarContactSteps } from "@/components/organisms/pulsar/PulsarContactSteps";

const steps = es.pulsar.contact.steps;

describe("PulsarContactSteps", () => {
  it("shows the chosen step", async () => {
    const user = userEvent.setup();
    render(<PulsarContactSteps title={es.pulsar.contact.stepsTitle} steps={steps} />);

    expect(screen.getByText(steps[0].body)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: steps[1].title }));
    expect(screen.getByText(steps[1].body)).toBeInTheDocument();
    expect(screen.queryByText(steps[0].body)).toBeNull();
  });
});
