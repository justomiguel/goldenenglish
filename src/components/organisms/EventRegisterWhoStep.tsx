"use client";

import { EventRegisterFlowChoice } from "@/components/organisms/EventRegisterFlowChoice";
import { EventRegisterOrderedQuestions } from "@/components/organisms/EventRegisterOrderedQuestions";
import { EventRegisterStep } from "@/components/organisms/EventRegisterStep";
import { EventRegisterTutorBlock } from "@/components/organisms/EventRegisterTutorBlock";
import type { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

interface EventRegisterWhoStepProps {
  step: string;
  locale: string;
  event: PublicEventDetail;
  surfaceVariant: PublicEventSurfaceVariant;
  labels: EventRegisterFormLabels;
  form: ReturnType<typeof useEventRegisterForm>;
}

export function EventRegisterWhoStep({
  step,
  locale,
  event,
  surfaceVariant,
  labels,
  form,
}: EventRegisterWhoStepProps) {
  return (
    <EventRegisterStep step={step} title={labels.steps.who} lead={labels.steps.whoLead}>
      {form.flow.ask ? (
        <EventRegisterFlowChoice
          label={labels.flowQuestion}
          flows={form.flow.options}
          value={form.flow.flowId}
          onChange={form.flow.onChange}
          disabled={form.footer.isPending}
          showPrices={event.priceByFlow}
          currency={event.currency}
          locale={locale}
          freeLabel={labels.free}
        />
      ) : event.priceByFlow && event.flows.length === 1 ? (
        <p className="text-base font-semibold tabular-nums text-[var(--color-primary)]">
          {formatEventFlowPriceLabel({
            price: event.flows[0]?.price ?? null,
            currency: event.currency,
            locale,
            freeLabel: labels.free,
          })}
        </p>
      ) : null}
      <EventRegisterOrderedQuestions
        sectionTitle={labels.participantSection}
        showHeading={false}
        surfaceVariant={surfaceVariant}
        questionOrder={form.flow.questionOrder}
        collectBirthDate={event.collectBirthDate}
        requirePhone={Boolean(event.requirePhone)}
        requireBirthDate={Boolean(event.requireBirthDate)}
        fields={event.fields}
        locale={locale}
        defaultLocale={event.defaultLocale}
        labels={{
          firstName: labels.firstName,
          lastName: labels.lastName,
          dni: labels.dni,
          email: labels.email,
          phone: labels.phone,
          birthDate: labels.birthDate,
        }}
        values={form.participant.values}
        onChange={form.participant.onChange}
        customValues={form.customFields.values}
        fieldFiles={form.customFields.files}
        onCustomChange={form.customFields.onChange}
        onFileChange={form.customFields.onFileChange}
        onFileValidationError={form.customFields.onFileValidationError}
        fileFieldErrors={form.customFields.fileErrors}
        uploadingFieldId={form.customFields.uploadingFieldId}
        selectPlaceholder={labels.selectPlaceholder}
        customFileFieldLabels={labels.customFieldFile}
        disabled={form.footer.isPending}
      />
      {form.tutor.isMinor ? (
        <EventRegisterTutorBlock
          values={form.tutor.values}
          onChange={form.tutor.onChange}
          labels={labels.tutor}
          surfaceVariant={surfaceVariant}
        />
      ) : null}
    </EventRegisterStep>
  );
}
