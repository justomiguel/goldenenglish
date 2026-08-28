import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RegisterSectionMultiSelect } from "@/components/register/RegisterSectionMultiSelect";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import { dictEn } from "@/test/dictEn";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const OPTIONS = [
  { id: A, label: "2026 — Yoga mañana" },
  { id: B, label: "2026 — Yoga tarde" },
];

function renderSelect(
  props: Partial<ComponentProps<typeof RegisterSectionMultiSelect>> = {},
) {
  const onChange = vi.fn();
  render(
    <RegisterSectionMultiSelect
      dict={dictEn.register}
      sectionOptions={OPTIONS}
      selectedIds={[]}
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange };
}

describe("RegisterSectionMultiSelect", () => {
  it("offers sections in a combobox instead of a checkbox list", () => {
    renderSelect();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: dictEn.register.level }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: OPTIONS[0].label })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: OPTIONS[1].label })).toBeInTheDocument();
  });

  it("selects a section from the combobox", () => {
    const { onChange } = renderSelect();
    fireEvent.change(screen.getByRole("combobox", { name: dictEn.register.level }), {
      target: { value: A },
    });
    expect(onChange).toHaveBeenCalledWith([A]);
  });

  it("selects the undecided option from the same combobox", () => {
    const { onChange } = renderSelect();
    fireEvent.change(screen.getByRole("combobox", { name: dictEn.register.level }), {
      target: { value: REGISTRATION_UNDECIDED_FORM_VALUE },
    });
    expect(onChange).toHaveBeenCalledWith([REGISTRATION_UNDECIDED_FORM_VALUE]);
  });

  it("adds another section from a second compact combobox", () => {
    const { onChange } = renderSelect({ selectedIds: [A] });
    fireEvent.change(
      screen.getByRole("combobox", { name: dictEn.register.sectionsAlsoJoin }),
      { target: { value: B } },
    );
    expect(onChange).toHaveBeenCalledWith([A, B]);
  });
});
