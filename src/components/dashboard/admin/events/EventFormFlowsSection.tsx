"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  saveEventRegistrationFlowAction,
  updateEventPriceByFlowAction,
} from "@/app/[locale]/dashboard/admin/events/eventRegistrationFlowActions";
import { Button } from "@/components/atoms/Button";
import { EventFormFlowCard } from "@/components/dashboard/admin/events/EventFormFlowCard";
import { EventFormFieldAddPanel } from "@/components/dashboard/admin/events/EventFormFieldAddPanel";
import type { ComponentProps } from "react";

interface FlowSummary {
  id: string;
  name: string;
  price: number | null;
  fieldOrder: string[];
}

interface FlowField {
  id: string;
  label: string;
  flowId: string | null;
}

interface EventFormFlowsSectionProps {
  locale: string;
  eventId: string;
  priceByFlow: boolean;
  nextPosition: number;
  flows: FlowSummary[];
  fields: FlowField[];
  addFieldLabels: ComponentProps<typeof EventFormFieldAddPanel>["labels"];
  labels: {
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
    moveUp: string;
    moveDown: string;
    addField: string;
    cancel: string;
  };
  rowLabels: {
    dragHandle: string;
    moveUp: string;
    moveDown: string;
    edit: string;
    archive: string;
    removeAsDelete: boolean;
    requiredLabel: string;
  };
  onEdit: (fieldId: string) => void;
  onArchive: (fieldId: string) => void;
}

export function EventFormFlowsSection({
  locale,
  eventId,
  priceByFlow,
  nextPosition,
  flows,
  fields,
  addFieldLabels,
  labels,
  rowLabels,
  onEdit,
  onArchive,
}: EventFormFlowsSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  function togglePrice(checked: boolean) {
    startTransition(async () => {
      const result = await updateEventPriceByFlowAction({ locale, eventId, priceByFlow: checked });
      if (!result.ok) {
        setError(result.message === "price_mode_conflict" ? labels.priceConflict : labels.errorSave);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  function addFlow() {
    const amount = priceByFlow ? Number(price) : null;
    if (!name.trim() || (priceByFlow && !Number.isFinite(amount))) {
      setError(labels.errorSave);
      return;
    }
    startTransition(async () => {
      const result = await saveEventRegistrationFlowAction({
        locale,
        eventId,
        name: name.trim(),
        price: amount,
      });
      if (!result.ok) {
        setError(labels.errorSave);
        return;
      }
      setName("");
      setPrice("");
      setAdding(false);
      setError(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{labels.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>
      <label className="flex min-h-[36px] items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={priceByFlow}
          disabled={pending}
          onChange={(event) => togglePrice(event.target.checked)}
        />
        {labels.priceSwitch}
      </label>
      {flows.length === 0 ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p> : null}
      {flows.map((flow) => (
        <EventFormFlowCard
          key={flow.id}
          locale={locale}
          eventId={eventId}
          priceByFlow={priceByFlow}
          nextPosition={nextPosition}
          flow={flow}
          fields={fields}
          labels={labels}
          rowLabels={rowLabels}
          onEdit={onEdit}
          onArchive={onArchive}
          addFieldLabels={addFieldLabels}
        />
      ))}
      {adding ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm text-[var(--color-foreground)]">
            {labels.nameLabel}
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1" />
          </label>
          {priceByFlow ? (
            <label className="text-sm text-[var(--color-foreground)]">
              {labels.priceLabel}
              <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1 block w-28 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1" />
            </label>
          ) : null}
          <Button type="button" onClick={addFlow} disabled={pending} className="min-h-[36px]">
            <Plus className="h-4 w-4" aria-hidden />
            {labels.save}
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={() => setAdding(true)} className="min-h-[36px]">
          <Plus className="h-4 w-4" aria-hidden />
          {labels.addButton}
        </Button>
      )}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </section>
  );
}
