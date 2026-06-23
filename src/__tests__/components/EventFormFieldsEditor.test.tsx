import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventFormFieldsEditor } from "@/components/dashboard/admin/events/EventFormFieldsEditor";
import en from "@/dictionaries/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  archiveEventFormFieldAction: vi.fn(),
  addEventFormFieldAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventRegistrationSettingsActions", () => ({
  updateEventCollectBirthDateAction: vi.fn(),
}));

const formLabels = en.admin.events.form;

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
        labels={{
          pageLead: formLabels.lead,
          collectBirthDate: formLabels.collectBirthDate,
          customFieldsTitle: formLabels.customFieldsTitle,
          customFieldsEmpty: formLabels.customFieldsEmpty,
          archive: en.admin.events.detail.archive,
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
          selectOptionsCount: formLabels.selectOptionsCount,
        }}
      />,
    );

    expect(screen.getByText(formLabels.baseFieldsTitle)).toBeInTheDocument();
    expect(screen.getByText(formLabels.baseFields.firstName)).toBeInTheDocument();
    expect(screen.getByText(formLabels.collectBirthDate.checkboxLabel)).toBeInTheDocument();
    expect(screen.getByText(formLabels.customFieldsEmpty)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.addButton })).toBeInTheDocument();
  });
});
