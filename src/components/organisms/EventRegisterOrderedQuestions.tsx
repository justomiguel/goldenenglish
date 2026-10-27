"use client";

import { FormField } from "@/components/molecules/FormField";
import { EventRegisterFormFields } from "@/components/organisms/EventRegisterFormFields";
import type { EventRegisterCustomFileFieldLabels } from "@/components/molecules/EventRegisterCustomFileField";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterTypography } from "@/lib/events/publicEventSurfaceClasses";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import type { RegistrationQuestionBaseId } from "@/lib/events/registrationFieldOrder";
import { resolveRegistrationFieldOrder } from "@/lib/events/registrationFieldOrder";

interface ParticipantValues {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
}

interface EventRegisterOrderedQuestionsProps {
  sectionTitle: string;
  showHeading?: boolean;
  surfaceVariant?: PublicEventSurfaceVariant;
  questionOrder: readonly string[];
  collectBirthDate: boolean;
  requirePhone: boolean;
  requireBirthDate: boolean;
  fields: EventFormFieldDefinition[];
  locale: string;
  defaultLocale: string;
  labels: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    birthDate: string;
  };
  values: ParticipantValues;
  onChange: { [Key in keyof ParticipantValues]: (value: string) => void };
  customValues: Record<string, string>;
  fieldFiles: Record<string, File | null>;
  onCustomChange: (fieldId: string, value: string) => void;
  onFileChange: (fieldId: string, file: File | null) => void;
  onFileValidationError: (fieldId: string, message: string) => void;
  fileFieldErrors: Record<string, string>;
  uploadingFieldId?: string | null;
  selectPlaceholder: string;
  customFileFieldLabels: EventRegisterCustomFileFieldLabels;
  disabled?: boolean;
}

const BASE_VALUE_KEY: Record<RegistrationQuestionBaseId, keyof ParticipantValues | null> = {
  firstName: "firstName",
  lastName: "lastName",
  dniOrPassport: "dni",
  email: "email",
  phone: "phone",
  birthDate: "birthDate",
};

export function EventRegisterOrderedQuestions({
  sectionTitle,
  showHeading = true,
  surfaceVariant = "default",
  questionOrder,
  collectBirthDate,
  requirePhone,
  requireBirthDate,
  fields,
  locale,
  defaultLocale,
  labels,
  values,
  onChange,
  customValues,
  fieldFiles,
  onCustomChange,
  onFileChange,
  onFileValidationError,
  fileFieldErrors,
  uploadingFieldId,
  selectPlaceholder,
  customFileFieldLabels,
  disabled = false,
}: EventRegisterOrderedQuestionsProps) {
  const typography = publicEventRegisterTypography(surfaceVariant);
  const order =
    questionOrder.length > 0
      ? questionOrder
      : resolveRegistrationFieldOrder({
          stored: [],
          extras: fields.map((field, index) => ({ id: field.id, position: index })),
          collectBirthDate,
        });
  const labelById: Record<RegistrationQuestionBaseId, string> = {
    firstName: labels.firstName,
    lastName: labels.lastName,
    dniOrPassport: labels.dni,
    email: labels.email,
    phone: labels.phone,
    birthDate: labels.birthDate,
  };

  return (
    <section className="space-y-3">
      {showHeading ? <h2 className={typography.sectionTitle}>{sectionTitle}</h2> : null}
      <div className="space-y-3">
        {order.map((token) => {
          if (token.startsWith("field:")) {
            const field = fields.find((item) => `field:${item.id}` === token);
            if (!field) return null;
            return (
              <EventRegisterFormFields
                key={token}
                fields={[field]}
                locale={locale}
                defaultLocale={defaultLocale}
                values={customValues}
                fieldFiles={fieldFiles}
                onChange={onCustomChange}
                onFileChange={onFileChange}
                onFileValidationError={onFileValidationError}
                fileFieldErrors={fileFieldErrors}
                uploadingFieldId={uploadingFieldId}
                selectPlaceholder={selectPlaceholder}
                customFileFieldLabels={customFileFieldLabels}
                disabled={disabled}
                surfaceVariant={surfaceVariant}
              />
            );
          }
          const id = token.slice("base:".length) as RegistrationQuestionBaseId;
          const valueKey = BASE_VALUE_KEY[id];
          if (!valueKey) return null;
          return (
            <FormField
              key={token}
              label={labelById[id]}
              type={id === "email" ? "email" : id === "phone" ? "tel" : id === "birthDate" ? "date" : "text"}
              value={values[valueKey]}
              onChange={(event) => onChange[valueKey](event.currentTarget.value)}
              required={id === "phone" ? requirePhone : id === "birthDate" ? requireBirthDate : true}
              autoComplete={
                id === "firstName"
                  ? "given-name"
                  : id === "lastName"
                    ? "family-name"
                    : id === "email"
                      ? "email"
                      : id === "phone"
                        ? "tel"
                        : "off"
              }
              surfaceVariant={surfaceVariant}
            />
          );
        })}
      </div>
    </section>
  );
}
