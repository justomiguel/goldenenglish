"use client";

import { FormField } from "@/components/molecules/FormField";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterTypography } from "@/lib/events/publicEventSurfaceClasses";

interface EventRegisterParticipantFieldsProps {
  sectionTitle: string;
  surfaceVariant?: PublicEventSurfaceVariant;
  showBirthDate?: boolean;
  labels: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    birthDate: string;
  };
  values: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    birthDate: string;
  };
  onChange: {
    firstName: (value: string) => void;
    lastName: (value: string) => void;
    dni: (value: string) => void;
    email: (value: string) => void;
    phone: (value: string) => void;
    birthDate: (value: string) => void;
  };
}

export function EventRegisterParticipantFields({
  sectionTitle,
  surfaceVariant = "default",
  showBirthDate = false,
  labels,
  values,
  onChange,
}: EventRegisterParticipantFieldsProps) {
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <section className="space-y-3">
      <h2 className={typography.sectionTitle}>{sectionTitle}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={labels.firstName}
          value={values.firstName}
          onChange={(eventInput) => onChange.firstName(eventInput.currentTarget.value)}
          required
          autoComplete="given-name"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.lastName}
          value={values.lastName}
          onChange={(eventInput) => onChange.lastName(eventInput.currentTarget.value)}
          required
          autoComplete="family-name"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.dni}
          value={values.dni}
          onChange={(eventInput) => onChange.dni(eventInput.currentTarget.value)}
          required
          autoComplete="off"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.email}
          type="email"
          value={values.email}
          onChange={(eventInput) => onChange.email(eventInput.currentTarget.value)}
          required
          autoComplete="email"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.phone}
          type="tel"
          value={values.phone}
          onChange={(eventInput) => onChange.phone(eventInput.currentTarget.value)}
          autoComplete="tel"
          surfaceVariant={surfaceVariant}
        />
        {showBirthDate ? (
          <FormField
            label={labels.birthDate}
            type="date"
            value={values.birthDate}
            onChange={(eventInput) => onChange.birthDate(eventInput.currentTarget.value)}
            surfaceVariant={surfaceVariant}
          />
        ) : null}
      </div>
    </section>
  );
}
