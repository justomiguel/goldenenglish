import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventFormFieldsEditor } from "@/components/dashboard/admin/events/EventFormFieldsEditor";
import en from "@/dictionaries/en.json";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  archiveEventFormFieldAction: vi.fn(),
  addEventFormFieldAction: vi.fn(),
  updateEventFormFieldAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventRegistrationSettingsActions", () => ({
  updateEventCollectBirthDateAction: vi.fn(),
}));

const formLabels = en.admin.events.form;

function buildLabels() {
  return {
    pageLead: formLabels.lead,
    collectBirthDate: formLabels.collectBirthDate,
    customFieldsTitle: formLabels.customFieldsTitle,
    customFieldsEmpty: formLabels.customFieldsEmpty,
    archive: en.admin.events.detail.archive,
    edit: formLabels.editButton,
    baseFields: {
      title: formLabels.baseFieldsTitle,
      lead: formLabels.baseFieldsLead,
      requiredBadge: formLabels.requiredBadge,
      optionalBadge: formLabels.optionalBadge,
      conditionalBadge: formLabels.conditionalBadge,
      baseFields: formLabels.baseFields,
      baseFieldNotes: formLabels.baseFieldNotes,
    },
    addField: {
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
    },
    editField: {
      title: formLabels.editFieldTitle,
      fieldKeyLabel: formLabels.fieldKeyLabel,
      fieldKeyReadOnlyHint: formLabels.fieldKeyReadOnlyHint,
      fieldTypeLabel: formLabels.fieldTypeLabel,
      fieldLabelLabel: formLabels.fieldLabelLabel,
      requiredLabel: formLabels.requiredLabel,
      saveButton: formLabels.saveButton,
      cancelButton: formLabels.cancelEditButton,
      errorSave: formLabels.errorSave,
      errorValidation: formLabels.errorValidation,
      errorSelectOptions: formLabels.errorSelectOptions,
      fieldTypes: formLabels.fieldTypes,
      previewTitle: formLabels.previewTitle,
      previewPlaceholder: formLabels.previewPlaceholder,
      selectOptions: formLabels.selectOptions,
      fileTypesLabel: formLabels.fileTypesLabel,
      fileTypesHint: formLabels.fileTypesHint,
    },
    selectOptionsCount: formLabels.selectOptionsCount,
  };
}

describe("EventFormFieldsEditor", () => {
  it("shows base fields and empty custom fields state", () => {
    render(
      <EventFormFieldsEditor
        eventId="evt-1"
        fields={[]}
        locale="es"
        defaultLocale="es"
        showBirthDateField={false}
        showResidencyField={false}
        showPaymentField={false}
        collectBirthDate={false}
        nextFieldPosition={0}
        labels={buildLabels()}
      />,
    );

    expect(screen.getByText(formLabels.baseFieldsTitle)).toBeInTheDocument();
    expect(screen.getByText(formLabels.baseFields.firstName)).toBeInTheDocument();
    expect(screen.getByText(formLabels.collectBirthDate.checkboxLabel)).toBeInTheDocument();
    expect(screen.getByText(formLabels.customFieldsEmpty)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.addButton })).toBeInTheDocument();
  });

  it("opens edit panel for an existing select field", async () => {
    const user = userEvent.setup();
    render(
      <EventFormFieldsEditor
        eventId="evt-1"
        fields={[
          {
            id: "field-1",
            fieldKey: "school_name",
            fieldType: "select",
            labelI18n: { es: "Colegio" },
            optionsI18n: { es: ["A", "B"] },
            required: false,
          },
        ]}
        locale="es"
        defaultLocale="es"
        showBirthDateField={false}
        showResidencyField={false}
        showPaymentField={false}
        collectBirthDate={false}
        nextFieldPosition={1}
        labels={buildLabels()}
      />,
    );

    expect(screen.getByText("Colegio")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: formLabels.editButton }));
    expect(screen.getByText(formLabels.editFieldTitle)).toBeInTheDocument();
    expect(screen.getByDisplayValue("school_name")).toBeDisabled();
    expect(screen.getByDisplayValue("A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("B")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: formLabels.addButton })).not.toBeInTheDocument();
  });
});
