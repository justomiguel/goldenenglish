import { Lock } from "lucide-react";
import {
  listVisibleEventRegistrationBaseFields,
  type EventRegistrationBaseFieldId,
  type EventRegistrationBaseFieldKind,
} from "@/lib/events/eventRegistrationBaseFields";

interface EventFormBuiltinFieldsSectionProps {
  showBirthDateField: boolean;
  showResidencyField: boolean;
  showPaymentField: boolean;
  labels: {
    title: string;
    lead: string;
    requiredBadge: string;
    optionalBadge: string;
    conditionalBadge: string;
    baseFields: Record<EventRegistrationBaseFieldId, string>;
    baseFieldNotes: Partial<Record<EventRegistrationBaseFieldId, string>>;
  };
}

function kindBadge(
  kind: EventRegistrationBaseFieldKind,
  labels: EventFormBuiltinFieldsSectionProps["labels"],
): string {
  if (kind === "required") return labels.requiredBadge;
  if (kind === "optional") return labels.optionalBadge;
  return labels.conditionalBadge;
}

export function EventFormBuiltinFieldsSection({
  showBirthDateField,
  showResidencyField,
  showPaymentField,
  labels,
}: EventFormBuiltinFieldsSectionProps) {
  const fields = listVisibleEventRegistrationBaseFields({
    showBirthDateField,
    showResidencyField,
    showPaymentField,
  });

  return (
    <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>
      <ul className="space-y-2">
        {fields.map((field) => {
          const note = labels.baseFieldNotes[field.id];
          return (
            <li
              key={field.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              <span className="inline-flex items-center gap-2 text-[var(--color-foreground)]">
                <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
                <span>
                  {labels.baseFields[field.id]}
                  {note ? (
                    <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">{note}</span>
                  ) : null}
                </span>
              </span>
              <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                {kindBadge(field.kind, labels)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
