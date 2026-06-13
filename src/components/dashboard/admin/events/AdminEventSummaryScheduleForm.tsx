"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { updateEventAction } from "@/app/[locale]/dashboard/admin/events/actions";
import {
  eventDatetimeLocalToIso,
  isoToEventDatetimeLocalValue,
} from "@/lib/events/eventDatetimeLocal";

interface AdminEventSummaryScheduleFormProps {
  locale: string;
  eventId: string;
  initial: {
    title: string;
    description: string;
    eventDate: string;
    location: string;
    capacity: number;
    priceLocal: number | null;
    priceNonLocal: number | null;
    currency: string;
    bankTransferInstructions: string | null;
  };
  labels: {
    eventDateLabel: string;
    locationLabel: string;
    capacityLabel: string;
    save: string;
    savedOk: string;
    errorSave: string;
    validationError: string;
  };
}

export function AdminEventSummaryScheduleForm({
  locale,
  eventId,
  initial,
  labels,
}: AdminEventSummaryScheduleFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(() => isoToEventDatetimeLocalValue(initial.eventDate));
  const [location, setLocation] = useState(initial.location);
  const [capacity, setCapacity] = useState(String(initial.capacity));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsedCapacity = Number.parseInt(capacity, 10);
    const eventDateIso = eventDatetimeLocalToIso(eventDate);
    if (!eventDateIso || !Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setMessage(labels.validationError);
      return;
    }

    startTransition(async () => {
      const result = await updateEventAction({
        locale,
        eventId,
        title: initial.title,
        description: initial.description,
        eventDate: eventDateIso,
        location: location.trim(),
        capacity: parsedCapacity,
        priceLocal: initial.priceLocal,
        priceNonLocal: initial.priceNonLocal,
        currency: initial.currency,
        bankTransferInstructions: initial.bankTransferInstructions,
      });
      if (!result.ok) {
        setMessage(labels.errorSave);
        return;
      }
      setMessage(labels.savedOk);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="event-schedule-date">{labels.eventDateLabel}</Label>
        <Input
          id="event-schedule-date"
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          disabled={pending}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="event-schedule-location">{labels.locationLabel}</Label>
        <Input
          id="event-schedule-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={pending}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="event-schedule-capacity">{labels.capacityLabel}</Label>
        <Input
          id="event-schedule-capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          disabled={pending}
          required
          className="mt-1"
        />
      </div>
      <Button type="submit" isLoading={pending} disabled={pending}>
        {!pending ? <CalendarClock className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.save}
      </Button>
      {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
    </form>
  );
}
