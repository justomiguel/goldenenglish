"use client";

import { FormField } from "@/components/molecules/FormField";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterPanelClass,
  publicEventRegisterTypography,
} from "@/lib/events/publicEventSurfaceClasses";

interface EventRegisterTutorBlockProps {
  surfaceVariant?: PublicEventSurfaceVariant;
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

export function EventRegisterTutorBlock({
  values,
  onChange,
  surfaceVariant = "default",
  labels,
}: EventRegisterTutorBlockProps) {
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <section className={publicEventRegisterPanelClass(surfaceVariant)}>
      <h3 className={typography.sectionTitle}>{labels.title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={labels.firstName}
          value={values.tutorFirstName}
          onChange={(event) => onChange("tutorFirstName", event.currentTarget.value)}
          required
          autoComplete="given-name"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.lastName}
          value={values.tutorLastName}
          onChange={(event) => onChange("tutorLastName", event.currentTarget.value)}
          required
          autoComplete="family-name"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.dni}
          value={values.tutorDniOrPassport}
          onChange={(event) => onChange("tutorDniOrPassport", event.currentTarget.value)}
          required
          autoComplete="off"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.email}
          type="email"
          value={values.tutorEmail}
          onChange={(event) => onChange("tutorEmail", event.currentTarget.value)}
          required
          autoComplete="email"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.phone}
          type="tel"
          value={values.tutorPhone}
          onChange={(event) => onChange("tutorPhone", event.currentTarget.value)}
          autoComplete="tel"
          surfaceVariant={surfaceVariant}
        />
        <FormField
          label={labels.relationship}
          value={values.tutorRelationship}
          onChange={(event) => onChange("tutorRelationship", event.currentTarget.value)}
          required
          autoComplete="off"
          surfaceVariant={surfaceVariant}
        />
      </div>
    </section>
  );
}
