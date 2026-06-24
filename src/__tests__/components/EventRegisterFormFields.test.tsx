import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventRegisterFormFields } from "@/components/organisms/EventRegisterFormFields";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import en from "@/dictionaries/en.json";

const customFileLabels = {
  fileButton: en.events.register.customFieldFile.fileButton,
  imageButton: en.events.register.customFieldFile.imageButton,
  noFile: en.events.register.customFieldFile.noFile,
  required: en.events.register.customFieldFile.required,
  tooLarge: en.events.register.customFieldFile.tooLarge,
  invalidType: en.events.register.customFieldFile.invalidType,
  fileInputAriaLabel: en.events.register.customFieldFile.fileInputAriaLabel,
  imageInputAriaLabel: en.events.register.customFieldFile.imageInputAriaLabel,
};

const baseProps = {
  locale: "es",
  defaultLocale: "es",
  values: {},
  fieldFiles: {},
  onChange: vi.fn(),
  onFileChange: vi.fn(),
  onFileValidationError: vi.fn(),
  fileFieldErrors: {},
  selectPlaceholder: en.events.register.selectPlaceholder,
  customFileFieldLabels: customFileLabels,
};

function field(
  overrides: Partial<EventFormFieldDefinition> & Pick<EventFormFieldDefinition, "id" | "fieldType">,
): EventFormFieldDefinition {
  return {
    fieldKey: overrides.fieldKey ?? overrides.id,
    labelI18n: overrides.labelI18n ?? { es: "Campo" },
    required: overrides.required ?? false,
    ...overrides,
  };
}

describe("EventRegisterFormFields", () => {
  it("renders a file picker for image custom fields", () => {
    render(
      <EventRegisterFormFields
        {...baseProps}
        fields={[
          field({
            id: "img-1",
            fieldType: "image",
            labelI18n: { es: "Foto carnet" },
          }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: customFileLabels.imageButton })).toBeInTheDocument();
    expect(screen.getByLabelText(customFileLabels.imageInputAriaLabel)).toHaveAttribute(
      "type",
      "file",
    );
    expect(screen.getByLabelText(customFileLabels.imageInputAriaLabel)).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders a file picker for file custom fields", () => {
    render(
      <EventRegisterFormFields
        {...baseProps}
        fields={[
          field({
            id: "file-1",
            fieldType: "file",
            labelI18n: { es: "Certificado" },
          }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: customFileLabels.fileButton })).toBeInTheDocument();
    expect(screen.getByLabelText(customFileLabels.fileInputAriaLabel)).toHaveAttribute(
      "type",
      "file",
    );
    expect(screen.getByLabelText(customFileLabels.fileInputAriaLabel)).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp,application/pdf",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
