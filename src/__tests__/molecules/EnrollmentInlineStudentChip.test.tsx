/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollmentInlineStudentChip } from "@/components/molecules/EnrollmentInlineStudentChip";

describe("EnrollmentInlineStudentChip", () => {
  it("calls onDismiss when remove is activated", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <EnrollmentInlineStudentChip
        label="Ada Lovelace"
        dismissAriaLabel="Remove"
        onDismiss={onDismiss}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
