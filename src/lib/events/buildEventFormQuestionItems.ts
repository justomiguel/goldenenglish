import type { EventRegistrationBaseFieldId } from "@/lib/events/eventRegistrationBaseFields";
import {
  resolveRegistrationFieldOrder,
  type RegistrationQuestionBaseId,
} from "@/lib/events/registrationFieldOrder";
import type { EventFormFieldDefinition } from "@/lib/events/types";

const ALWAYS_REQUIRED = new Set<RegistrationQuestionBaseId>([
  "firstName",
  "lastName",
  "dniOrPassport",
  "email",
]);

export interface EventFormQuestionOrderItem {
  token: string;
  label: string;
  note?: string;
  badge?: string;
  extra?: {
    id: string;
    typeLabel: string;
    optionCountLabel?: string;
  };
  requirement?: {
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
  };
}

function extraQuestionItem(
  field: EventFormFieldDefinition & { position?: number },
  input: {
    locale: string;
    defaultLocale: string;
    requiredBadge: string;
    fieldTypeLabels: Record<string, string>;
    selectOptionsCount: string;
  },
): EventFormQuestionOrderItem {
  const options = field.optionsI18n?.[input.locale] ?? field.optionsI18n?.[input.defaultLocale] ?? [];
  const optionCount = field.fieldType === "select" ? options.length : 0;
  return {
    token: `field:${field.id}`,
    label: pickLabel(field.labelI18n, input.locale, input.defaultLocale) || field.fieldKey,
    badge: field.required ? input.requiredBadge : undefined,
    extra: {
      id: field.id,
      typeLabel: input.fieldTypeLabels[field.fieldType] ?? field.fieldType,
      optionCountLabel:
        optionCount > 0
          ? input.selectOptionsCount.replace("{{count}}", String(optionCount))
          : undefined,
    },
  };
}

/** Extras that belong to one flow, in that flow's order. */
export function buildFlowQuestionItems(input: {
  fields: Array<EventFormFieldDefinition & { position?: number }>;
  fieldOrder: readonly string[];
  locale: string;
  defaultLocale: string;
  requiredBadge: string;
  fieldTypeLabels: Record<string, string>;
  selectOptionsCount: string;
}): EventFormQuestionOrderItem[] {
  const byToken = new Map(input.fields.map((field) => [`field:${field.id}`, field]));
  const ordered = input.fieldOrder.flatMap((token) => {
    const field = byToken.get(token);
    return field ? [field] : [];
  });
  const rest = input.fields
    .filter((field) => !ordered.some((item) => item.id === field.id))
    .toSorted((left, right) => (left.position ?? 0) - (right.position ?? 0));
  return [...ordered, ...rest].map((field) => extraQuestionItem(field, input));
}

function pickLabel(
  labels: Record<string, string> | undefined,
  locale: string,
  fallback: string,
) {
  if (!labels) return "";
  return labels[locale] ?? labels[fallback] ?? Object.values(labels)[0] ?? "";
}

export function buildEventFormQuestionItems(input: {
  fields: Array<EventFormFieldDefinition & { position?: number }>;
  locale: string;
  defaultLocale: string;
  collectBirthDate: boolean;
  registrationFieldOrder: readonly string[];
  requirePhone: boolean;
  requireBirthDate: boolean;
  baseLabels: Record<EventRegistrationBaseFieldId, string>;
  baseNotes: Partial<Record<EventRegistrationBaseFieldId, string>>;
  requiredBadge: string;
  fieldTypeLabels: Record<string, string>;
  selectOptionsCount: string;
  onRequirement: (kind: "phone" | "birthDate", checked: boolean) => void;
}): EventFormQuestionOrderItem[] {
  const tokens = resolveRegistrationFieldOrder({
    stored: input.registrationFieldOrder,
    extras: input.fields.map((field, index) => ({
      id: field.id,
      position: field.position ?? index,
    })),
    collectBirthDate: input.collectBirthDate,
  });

  return tokens.flatMap((token): EventFormQuestionOrderItem[] => {
    if (token.startsWith("field:")) {
      const field = input.fields.find((item) => `field:${item.id}` === token);
      if (!field) return [];
      const options =
        field.optionsI18n?.[input.locale] ?? field.optionsI18n?.[input.defaultLocale] ?? [];
      const optionCount = field.fieldType === "select" ? options.length : 0;
      return [
        {
          token,
          label: pickLabel(field.labelI18n, input.locale, input.defaultLocale) || field.fieldKey,
          badge: field.required ? input.requiredBadge : undefined,
          extra: {
            id: field.id,
            typeLabel: input.fieldTypeLabels[field.fieldType] ?? field.fieldType,
            optionCountLabel:
              optionCount > 0
                ? input.selectOptionsCount.replace("{{count}}", String(optionCount))
                : undefined,
          },
        },
      ];
    }

    const id = token.slice("base:".length) as RegistrationQuestionBaseId;
    const requirement =
      id === "phone"
        ? {
            checked: input.requirePhone,
            disabled: false,
            onChange: (checked: boolean) => input.onRequirement("phone", checked),
          }
        : id === "birthDate"
          ? {
              checked: input.requireBirthDate,
              disabled: false,
              onChange: (checked: boolean) => input.onRequirement("birthDate", checked),
            }
          : undefined;
    return [
      {
        token,
        label: input.baseLabels[id],
        note: requirement ? input.baseNotes[id] : undefined,
        badge: ALWAYS_REQUIRED.has(id) ? input.requiredBadge : undefined,
        requirement,
      },
    ];
  });
}
