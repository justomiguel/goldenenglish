"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { saveAcademicSectionDeliveryModeAction } from "@/app/[locale]/dashboard/admin/academic/sectionDeliveryActions";
import type { CommercialPlan } from "@/lib/pulsar/commercialPlan";
import type { SectionDeliveryMode } from "@/lib/academics/sectionDeliveryMode";
import type { Dictionary } from "@/types/i18n";

type Dict = Dictionary["dashboard"]["academicSectionPage"]["deliveryMode"];

export interface AcademicSectionDeliveryModeFormProps {
  locale: string;
  sectionId: string;
  plan: CommercialPlan;
  mode: SectionDeliveryMode;
  credentialsReady: boolean;
  dict: Dict;
}

const MODES: SectionDeliveryMode[] = ["in_person", "hybrid", "remote"];

function weekdayLabel(locale: string, dayOfWeek: number): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + dayOfWeek)),
  );
}

function failedSlotLine(
  locale: string,
  template: string,
  slot: { dayOfWeek: number; startTime: string },
): string {
  return template
    .replaceAll("{day}", weekdayLabel(locale, slot.dayOfWeek))
    .replaceAll("{time}", slot.startTime);
}

export function AcademicSectionDeliveryModeForm({
  locale,
  sectionId,
  plan,
  mode,
  credentialsReady,
  dict,
}: AcademicSectionDeliveryModeFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SectionDeliveryMode>(mode);
  const [failedSlots, setFailedSlots] = useState<{ dayOfWeek: number; startTime: string }[]>([]);
  const [pending, start] = useTransition();

  if (plan !== "ecosistema") return null;

  const showDailyLine = selected === "hybrid" || selected === "remote";
  const labels: Record<SectionDeliveryMode, string> = {
    in_person: dict.inPerson,
    hybrid: dict.hybrid,
    remote: dict.remote,
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    start(async () => {
      const result = await saveAcademicSectionDeliveryModeAction({
        locale,
        sectionId,
        mode: selected,
      });
      if (!result.ok) return;
      setFailedSlots(result.failedSlots);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div role="radiogroup" aria-label={dict.title} className="space-y-2">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">{dict.title}</p>
        {MODES.map((value) => (
          <label
            key={value}
            className="flex min-h-[44px] items-center gap-2 text-sm text-[var(--color-foreground)]"
          >
            <input
              type="radio"
              name="deliveryMode"
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            {labels[value]}
          </label>
        ))}
      </div>
      {showDailyLine && !credentialsReady ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.missingKey}</p>
      ) : null}
      {showDailyLine
        ? failedSlots.map((slot) => (
            <p
              key={`${slot.dayOfWeek}-${slot.startTime}`}
              className="text-sm text-[var(--color-muted-foreground)]"
            >
              {failedSlotLine(locale, dict.failedSlot, slot)}
            </p>
          ))
        : null}
      <Button type="submit" isLoading={pending}>
        <Video className="h-4 w-4" aria-hidden />
        {dict.save}
      </Button>
    </form>
  );
}
