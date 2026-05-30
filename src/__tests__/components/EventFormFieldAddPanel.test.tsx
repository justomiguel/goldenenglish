import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventFormFieldAddPanel } from "@/components/dashboard/admin/events/EventFormFieldAddPanel";
import en from "@/dictionaries/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  addEventFormFieldAction: vi.fn(),
}));

const formLabels = en.admin.events.form;

const panelLabels = {
  title: formLabels.addFieldTitle,
  fieldKeyLabel: formLabels.fieldKeyLabel,
  fieldKeyHint: formLabels.fieldKeyHint,
  fieldTypeLabel: formLabels.fieldTypeLabel,
  fieldLabelLabel: formLabels.fieldLabelLabel,
  requiredLabel: formLabels.requiredLabel,
  addButton: formLabels.addButton,
  errorSave: formLabels.errorSave,
  errorValidation: formLabels.errorValidation,
  errorDuplicateKey: formLabels.errorDuplicateKey,
  errorSelectOptions: formLabels.errorSelectOptions,
  fieldTypes: formLabels.fieldTypes,
  previewTitle: formLabels.previewTitle,
  previewPlaceholder: formLabels.previewPlaceholder,
  selectOptions: formLabels.selectOptions,
  fileTypesLabel: formLabels.fileTypesLabel,
  fileTypesHint: formLabels.fileTypesHint,
};

describe("EventFormFieldAddPanel", () => {
  it("shows two option rows when select type is chosen", async () => {
    const user = userEvent.setup();

    render(
      <EventFormFieldAddPanel
        locale="es"
        eventId="evt-1"
        nextPosition={0}
        labels={panelLabels}
      />,
    );

    await user.selectOptions(screen.getByLabelText(formLabels.fieldTypeLabel), "select");

    expect(screen.getByText(formLabels.selectOptions.title)).toBeInTheDocument();
    expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: formLabels.selectOptions.addOption }),
    ).toBeInTheDocument();
  });

  it("adds a third option row from the add button", async () => {
    const user = userEvent.setup();

    render(
      <EventFormFieldAddPanel
        locale="es"
        eventId="evt-1"
        nextPosition={0}
        labels={panelLabels}
      />,
    );

    await user.selectOptions(screen.getByLabelText(formLabels.fieldTypeLabel), "select");
    await user.click(screen.getByRole("button", { name: formLabels.selectOptions.addOption }));

    expect(screen.getByLabelText("Option 3")).toBeInTheDocument();
  });

  it("shows a preview block for text fields", () => {
    render(
      <EventFormFieldAddPanel
        locale="es"
        eventId="evt-1"
        nextPosition={0}
        labels={panelLabels}
      />,
    );

    expect(screen.getByText(formLabels.previewTitle)).toBeInTheDocument();
  });
});
