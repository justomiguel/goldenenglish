"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, X } from "lucide-react";
import { archiveEventFormFieldAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { Button } from "@/components/atoms/Button";
import { EventFormBuiltinFieldsSection } from "@/components/dashboard/admin/events/EventFormBuiltinFieldsSection";
import { EventFormCollectBirthDateToggle } from "@/components/dashboard/admin/events/EventFormCollectBirthDateToggle";
import { EventFormFieldAddPanel } from "@/components/dashboard/admin/events/EventFormFieldAddPanel";
import { EventFormFieldEditPanel } from "@/components/dashboard/admin/events/EventFormFieldEditPanel";
import { EventFormQuestionOrderList } from "@/components/dashboard/admin/events/EventFormQuestionOrderList";
import { EventFormFieldBoard } from "@/components/dashboard/admin/events/EventFormFieldBoard";
import { EventFormFlowsSection } from "@/components/dashboard/admin/events/EventFormFlowsSection";
import type { EventFormFieldsEditorProps } from "@/components/dashboard/admin/events/EventFormFieldsEditorProps";
import { useEventFormQuestionOrder } from "@/hooks/useEventFormQuestionOrder";
import {
  buildEventFormQuestionItems,
  buildFlowQuestionItems,
} from "@/lib/events/buildEventFormQuestionItems";
import { buildEventPreviewPath } from "@/lib/site/publicSharePaths";

export function EventFormFieldsEditor({
  eventId,
  fields,
  locale,
  defaultLocale,
  showBirthDateField,
  showResidencyField,
  showPaymentField,
  collectBirthDate,
  registrationFieldOrder,
  requirePhone,
  requireBirthDate,
  priceByFlow = false,
  registrationFlows = [],
  eventPublished = false,
  eventSlug = "",
  nextFieldPosition,
  labels,
}: EventFormFieldsEditorProps) {
  const router = useRouter();
  const [archivePending, startArchive] = useTransition();
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);
  const order = useEventFormQuestionOrder({
    locale,
    eventId,
    requirePhone,
    requireBirthDate,
    errorOrderSave: labels.errorOrderSave,
    errorRequirementsSave: labels.errorRequirementsSave,
  });
  const editingField = fields.find((field) => field.id === editingFieldId) ?? null;
  const pending = archivePending || order.pending;

  function handleArchive(fieldId: string) {
    startArchive(async () => {
      const result = await archiveEventFormFieldAction(locale, fieldId);
      if (!result.ok) return;
      if (editingFieldId === fieldId) setEditingFieldId(null);
      router.refresh();
    });
  }

  const questionItems = buildEventFormQuestionItems({
    fields: registrationFlows.length > 0 ? fields.filter((field) => !field.flowId) : fields,
    locale,
    defaultLocale,
    collectBirthDate,
    registrationFieldOrder,
    requirePhone,
    requireBirthDate,
    baseLabels: labels.baseFields.baseFields,
    baseNotes: labels.baseFields.baseFieldNotes,
    requiredBadge: labels.baseFields.requiredBadge,
    fieldTypeLabels: labels.addField.fieldTypes,
    selectOptionsCount: labels.selectOptionsCount,
    onRequirement: order.setRequirement,
  });
  const flowItems = Object.fromEntries(
    registrationFlows.map((flow) => [
      flow.id,
      buildFlowQuestionItems({
        fields: fields.filter((field) => field.flowId === flow.id),
        fieldOrder: flow.fieldOrder,
        locale,
        defaultLocale,
        requiredBadge: labels.baseFields.requiredBadge,
        fieldTypeLabels: labels.addField.fieldTypes,
        selectOptionsCount: labels.selectOptionsCount,
      }),
    ]),
  );
  const rowLabels = {
    dragHandle: labels.dragHandle,
    moveUp: labels.moveUp,
    moveDown: labels.moveDown,
    edit: labels.edit,
    archive: eventPublished ? labels.archive : labels.deleteField,
    removeAsDelete: !eventPublished,
    requiredLabel: labels.addField.requiredLabel,
  };
  const sharedFields = (
    <EventFormQuestionOrderList
      title={labels.questionOrderTitle}
      lead={labels.questionOrderLead}
      items={questionItems}
      pending={pending}
      error={order.error}
      labels={{ ...rowLabels, customFieldsEmpty: labels.customFieldsEmpty }}
      onReorder={order.reorder}
      onEdit={setEditingFieldId}
      onArchive={handleArchive}
    >
      <Button
        type="button"
        variant={addingField ? "ghost" : "primary"}
        aria-expanded={addingField}
        onClick={() => setAddingField((open) => !open)}
      >
        {addingField ? (
          <X className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {addingField ? labels.editField.cancelButton : labels.addField.title}
      </Button>
      {addingField ? (
        <EventFormFieldAddPanel
          locale={locale}
          eventId={eventId}
          nextPosition={nextFieldPosition}
          labels={labels.addField}
          onAdded={() => setAddingField(false)}
        />
      ) : null}
    </EventFormQuestionOrderList>
  );
  const flows = labels.flows ? (
    <EventFormFlowsSection
      locale={locale}
      eventId={eventId}
      priceByFlow={priceByFlow}
      nextPosition={nextFieldPosition}
      flows={registrationFlows}
      fields={fields.map((field) => ({
        id: field.id,
        flowId: field.flowId ?? null,
        label: field.labelI18n[locale] ?? field.labelI18n[defaultLocale] ?? field.fieldKey,
      }))}
      addFieldLabels={labels.addField}
      rowLabels={rowLabels}
      onEdit={setEditingFieldId}
      onArchive={handleArchive}
      labels={{
        ...labels.flows,
        moveUp: labels.moveUp,
        moveDown: labels.moveDown,
        addField: labels.addField.title,
        cancel: labels.editField.cancelButton,
      }}
    />
  ) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.pageLead}</p>
      <Link
        href={buildEventPreviewPath(locale, eventSlug)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        {labels.previewButton}
      </Link>

      <EventFormCollectBirthDateToggle
        locale={locale}
        eventId={eventId}
        collectBirthDate={collectBirthDate}
        labels={labels.collectBirthDate}
      />

      {registrationFlows.length > 0 ? (
        <EventFormFieldBoard
          locale={locale}
          eventId={eventId}
          sharedItems={questionItems}
          flowItems={flowItems}
          errorSave={labels.errorOrderSave}
        >
          {sharedFields}
          {flows}
        </EventFormFieldBoard>
      ) : (
        <>
          {sharedFields}
          {flows}
        </>
      )}

      <EventFormBuiltinFieldsSection
        showBirthDateField={showBirthDateField}
        showResidencyField={showResidencyField}
        showPaymentField={showPaymentField}
        labels={labels.baseFields}
      />

      {editingField ? (
        <EventFormFieldEditPanel
          key={editingField.id}
          locale={locale}
          defaultLocale={defaultLocale}
          field={editingField}
          labels={labels.editField}
          onCancel={() => setEditingFieldId(null)}
        />
      ) : null}
    </div>
  );
}
