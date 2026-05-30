"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { createEventAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { AdminEventPricingFields } from "@/components/dashboard/admin/events/AdminEventPricingFields";
import { EventDescriptionEditor } from "@/components/dashboard/admin/events/EventDescriptionEditor";
import { isEventLocale } from "@/lib/events/domain";
import type { Dictionary } from "@/types/i18n";

type EditorLabels = Dictionary["admin"]["cms"]["blog"]["editor"];
type AcademicLabels = Dictionary["dashboard"]["adminContents"];

interface AdminEventCreateFormLabels {
  titleLabel: string;
  descriptionLabel: string;
  eventDateLabel: string;
  locationLabel: string;
  capacityLabel: string;
  priceLocalLabel: string;
  priceNonLocalLabel: string;
  priceHint: string;
  currencyLabel: string;
  bankTransferInstructionsLabel: string;
  bankTransferInstructionsHint: string;
  submit: string;
  back: string;
  errorSave: string;
  validationError: string;
}

interface AdminEventCreateFormProps {
  locale: string;
  labels: AdminEventCreateFormLabels;
  editorLabels: EditorLabels;
  academicLabels: AcademicLabels;
}

function parseOptionalPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function AdminEventCreateForm({
  locale,
  labels,
  editorLabels,
  academicLabels,
}: AdminEventCreateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [priceLocal, setPriceLocal] = useState("");
  const [priceNonLocal, setPriceNonLocal] = useState("");
  const [currency, setCurrency] = useState("CLP");
  const [bankTransferInstructions, setBankTransferInstructions] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const parsedCapacity = Number.parseInt(capacity, 10);
    if (!trimmedTitle || !eventDate || !Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setError(labels.validationError);
      return;
    }

    const parsedLocal = parseOptionalPrice(priceLocal);
    const parsedNonLocal = parseOptionalPrice(priceNonLocal);
    if ((priceLocal.trim() && parsedLocal === null) || (priceNonLocal.trim() && parsedNonLocal === null)) {
      setError(labels.validationError);
      return;
    }

    const eventDateIso = new Date(eventDate).toISOString();
    if (Number.isNaN(Date.parse(eventDateIso))) {
      setError(labels.validationError);
      return;
    }

    startTransition(async () => {
      const result = await createEventAction({
        locale,
        title: trimmedTitle,
        description,
        eventDate: eventDateIso,
        location,
        capacity: parsedCapacity,
        priceLocal: parsedLocal,
        priceNonLocal: parsedNonLocal ?? parsedLocal,
        currency: currency.trim() || "CLP",
        bankTransferInstructions: bankTransferInstructions.trim() || null,
        defaultLocale: isEventLocale(locale) ? locale : "es",
      });
      if (!result.ok || !result.eventId) {
        setError(labels.errorSave);
        return;
      }
      router.push(`/${locale}/dashboard/admin/events/${result.eventId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="event-title">{labels.titleLabel}</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            required
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <EventDescriptionEditor
            descriptionLabel={labels.descriptionLabel}
            editorLabels={editorLabels}
            academicLabels={academicLabels}
            descriptionHtml={description}
            onDescriptionHtmlChange={setDescription}
            onError={setUploadError}
            disabled={pending}
          />
        </div>
        <div>
          <Label htmlFor="event-date">{labels.eventDateLabel}</Label>
          <Input
            id="event-date"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={pending}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="event-location">{labels.locationLabel}</Label>
          <Input
            id="event-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={pending}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="event-capacity">{labels.capacityLabel}</Label>
          <Input
            id="event-capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={pending}
            required
            className="mt-1"
          />
        </div>
        <AdminEventPricingFields
          priceLocal={priceLocal}
          priceNonLocal={priceNonLocal}
          currency={currency}
          bankTransferInstructions={bankTransferInstructions}
          disabled={pending}
          labels={{
            priceLocalLabel: labels.priceLocalLabel,
            priceNonLocalLabel: labels.priceNonLocalLabel,
            priceHint: labels.priceHint,
            currencyLabel: labels.currencyLabel,
            bankTransferInstructionsLabel: labels.bankTransferInstructionsLabel,
            bankTransferInstructionsHint: labels.bankTransferInstructionsHint,
          }}
          onPriceLocalChange={setPriceLocal}
          onPriceNonLocalChange={setPriceNonLocal}
          onCurrencyChange={setCurrency}
          onBankTransferInstructionsChange={setBankTransferInstructions}
        />
      </div>

      {uploadError ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {uploadError}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={pending} disabled={pending}>
          {!pending ? <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.submit}
        </Button>
        <Link
          href={`/${locale}/dashboard/admin/events`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {labels.back}
        </Link>
      </div>
    </form>
  );
}
