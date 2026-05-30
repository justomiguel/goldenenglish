"use client";

import { FormField } from "@/components/molecules/FormField";

interface EventRegisterTutorBlockProps {
  values: {
    tutorFirstName: string;
    tutorLastName: string;
    tutorDniOrPassport: string;
    tutorEmail: string;
    tutorPhone: string;
    tutorRelationship: string;
  };
  onChange: (key: keyof EventRegisterTutorBlockProps["values"], value: string) => void;
  labels: {
    title: string;
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    relationship: string;
  };
}

export function EventRegisterTutorBlock({ values, onChange, labels }: EventRegisterTutorBlockProps) {
  return (
    <section className="space-y-3 rounded-xl border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={labels.firstName}
          value={values.tutorFirstName}
          onChange={(event) => onChange("tutorFirstName", event.currentTarget.value)}
          required
          autoComplete="given-name"
        />
        <FormField
          label={labels.lastName}
          value={values.tutorLastName}
          onChange={(event) => onChange("tutorLastName", event.currentTarget.value)}
          required
          autoComplete="family-name"
        />
        <FormField
          label={labels.dni}
          value={values.tutorDniOrPassport}
          onChange={(event) => onChange("tutorDniOrPassport", event.currentTarget.value)}
          required
          autoComplete="off"
        />
        <FormField
          label={labels.email}
          type="email"
          value={values.tutorEmail}
          onChange={(event) => onChange("tutorEmail", event.currentTarget.value)}
          required
          autoComplete="email"
        />
        <FormField
          label={labels.phone}
          type="tel"
          value={values.tutorPhone}
          onChange={(event) => onChange("tutorPhone", event.currentTarget.value)}
          autoComplete="tel"
        />
        <FormField
          label={labels.relationship}
          value={values.tutorRelationship}
          onChange={(event) => onChange("tutorRelationship", event.currentTarget.value)}
          required
          autoComplete="off"
        />
      </div>
    </section>
  );
}
