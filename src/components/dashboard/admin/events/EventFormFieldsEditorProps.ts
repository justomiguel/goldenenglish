import type { EventFormFieldEditLabels } from "@/components/dashboard/admin/events/EventFormFieldEditPanel";
import type { EventRegistrationBaseFieldId } from "@/lib/events/eventRegistrationBaseFields";
import type { EventFormFieldDefinition, EventFormFieldType } from "@/lib/events/types";

export interface EventFormRegistrationFlowSummary {
  id: string;
  name: string;
  price: number | null;
  fieldOrder: string[];
}

export interface EventFormFieldsEditorProps {
  eventId: string;
  fields: Array<EventFormFieldDefinition & { position?: number }>;
  locale: string;
  defaultLocale: string;
  showBirthDateField: boolean;
  showResidencyField: boolean;
  showPaymentField: boolean;
  collectBirthDate: boolean;
  registrationFieldOrder: string[];
  requirePhone: boolean;
  requireBirthDate: boolean;
  priceByFlow?: boolean;
  registrationFlows?: EventFormRegistrationFlowSummary[];
  eventPublished?: boolean;
  eventSlug?: string;
  nextFieldPosition: number;
  labels: {
    pageLead: string;
    previewButton: string;
    previewBanner: string;
    previewBack: string;
    deleteField: string;
    collectBirthDate: {
      title: string;
      lead: string;
      checkboxLabel: string;
      errorSave: string;
    };
    customFieldsTitle: string;
    customFieldsEmpty: string;
    questionOrderTitle: string;
    questionOrderLead: string;
    dragHandle: string;
    moveUp: string;
    moveDown: string;
    errorOrderSave: string;
    errorRequirementsSave: string;
    flows?: {
      title: string;
      lead: string;
      addButton: string;
      nameLabel: string;
      priceLabel: string;
      priceSwitch: string;
      priceConflict: string;
      save: string;
      archive: string;
      empty: string;
      errorSave: string;
      dropHint: string;
    };
    archive: string;
    edit: string;
    baseFields: {
      title: string;
      lead: string;
      requiredBadge: string;
      optionalBadge: string;
      conditionalBadge: string;
      baseFields: Record<EventRegistrationBaseFieldId, string>;
      baseFieldNotes: Partial<Record<EventRegistrationBaseFieldId, string>>;
    };
    addField: {
      title: string;
      fieldKeyLabel: string;
      fieldKeyHint: string;
      fieldTypeLabel: string;
      fieldLabelLabel: string;
      requiredLabel: string;
      addButton: string;
      errorSave: string;
      errorValidation: string;
      errorDuplicateKey: string;
      errorSelectOptions: string;
      fieldTypes: Record<EventFormFieldType, string>;
      previewTitle: string;
      previewPlaceholder: Record<Exclude<EventFormFieldType, "select">, string>;
      selectOptions: {
        title: string;
        hint: string;
        optionLabel: string;
        addOption: string;
        removeOptionAria: string;
      };
      fileTypesLabel: string;
      fileTypesHint: string;
    };
    editField: EventFormFieldEditLabels;
    selectOptionsCount: string;
  };
}
