"use client";

import { FormField } from "@/components/molecules/FormField";

interface EventRegisterParticipantFieldsProps {
  sectionTitle: string;
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
  labels,
  values,
  onChange,
}: EventRegisterParticipantFieldsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{sectionTitle}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={labels.firstName}
          value={values.firstName}
          onChange={(eventInput) => onChange.firstName(eventInput.currentTarget.value)}
          required
          autoComplete="given-name"
        />
        <FormField
          label={labels.lastName}
          value={values.lastName}
          onChange={(eventInput) => onChange.lastName(eventInput.currentTarget.value)}
          required
          autoComplete="family-name"
        />
        <FormField
          label={labels.dni}
          value={values.dni}
          onChange={(eventInput) => onChange.dni(eventInput.currentTarget.value)}
          required
          autoComplete="off"
        />
        <FormField
          label={labels.email}
          type="email"
          value={values.email}
          onChange={(eventInput) => onChange.email(eventInput.currentTarget.value)}
          required
          autoComplete="email"
        />
        <FormField
          label={labels.phone}
          type="tel"
          value={values.phone}
          onChange={(eventInput) => onChange.phone(eventInput.currentTarget.value)}
          autoComplete="tel"
        />
        <FormField
          label={labels.birthDate}
          type="date"
          value={values.birthDate}
          onChange={(eventInput) => onChange.birthDate(eventInput.currentTarget.value)}
        />
      </div>
    </section>
  );
}
