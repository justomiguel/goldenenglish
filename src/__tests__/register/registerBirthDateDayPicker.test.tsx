// REGRESSION CHECK: year/month navigation must not snap back to the default (y-12) month.
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { RegisterBirthDateDayPicker } from "@/components/molecules/RegisterBirthDateDayPicker";
import { dictEn } from "@/test/dictEn";

const labels = {
  birthDate: dictEn.register.birthDate,
  birthMonth: dictEn.register.birthMonth,
  birthYear: dictEn.register.birthYear,
  birthDay: dictEn.register.birthDay,
  birthDayPlaceholder: dictEn.register.birthDayPlaceholder,
  birthDateHint: dictEn.register.birthDateHint,
  birthDatePickPrompt: dictEn.register.birthDatePickPrompt,
  birthDatePickedAnnouncement: dictEn.register.birthDatePickedAnnouncement,
};

function ControlledPicker({
  initial = "",
  onChange = vi.fn(),
}: {
  initial?: string;
  onChange?: (iso: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <RegisterBirthDateDayPicker
      locale="es"
      birthDateLegendRequired
      labels={labels}
      value={value}
      onChange={(iso) => {
        setValue(iso);
        onChange(iso);
      }}
    />
  );
}

describe("RegisterBirthDateDayPicker", () => {
  it("keeps year/month navigation after mount (no snap-back to default)", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);

    await user.selectOptions(screen.getByLabelText(labels.birthYear), "1990");
    await user.selectOptions(screen.getByLabelText(labels.birthMonth), "5");

    await waitFor(() => {
      expect(screen.getByLabelText(labels.birthYear)).toHaveValue("1990");
      expect(screen.getByLabelText(labels.birthMonth)).toHaveValue("5");
    });

    // Allow any mount/value effects to flush — must still stay on June 1990.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByLabelText(labels.birthYear)).toHaveValue("1990");
    expect(screen.getByLabelText(labels.birthMonth)).toHaveValue("5");
    expect(screen.getByRole("grid", { name: /junio 1990/i })).toBeInTheDocument();
  });

  it("commits the picked day and follows the value month afterward", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledPicker onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(labels.birthYear), "1990");
    await user.selectOptions(screen.getByLabelText(labels.birthMonth), "5");
    await user.click(
      screen.getByRole("button", { name: /15 de junio de 1990/i }),
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("1990-06-15");
    });
    expect(screen.getByLabelText(labels.birthYear)).toHaveValue("1990");
    expect(screen.getByLabelText(labels.birthMonth)).toHaveValue("5");
  });

  it("toggles the day calendar from the trigger", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    const trigger = screen.getByRole("button", { name: new RegExp(labels.birthDay, "i") });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
