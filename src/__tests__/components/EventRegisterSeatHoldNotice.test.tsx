import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventRegisterSeatHoldNotice } from "@/components/organisms/EventRegisterSeatHoldNotice";

describe("EventRegisterSeatHoldNotice", () => {
  it("renders the hold clock in large foreground type", () => {
    render(
      <EventRegisterSeatHoldNotice
        placement="inline"
        notice={null}
        countdown="We keep your seats for 9:59."
        chooseAnotherLabel="Choose another seat"
        useSuggestedLabel={null}
        onChooseAnother={() => {}}
        onUseSuggestions={() => {}}
      />,
    );
    const clock = screen.getByText("We keep your seats for 9:59.");
    expect(clock.className).toContain("text-2xl");
    expect(clock.className).toContain("text-[var(--color-foreground)]");
  });

  it("renders nothing when there is no clock and no lost seat", () => {
    const { container } = render(
      <EventRegisterSeatHoldNotice
        placement="sticky"
        notice={null}
        countdown={null}
        chooseAnotherLabel="Choose another seat"
        useSuggestedLabel={null}
        onChooseAnother={() => {}}
        onUseSuggestions={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
