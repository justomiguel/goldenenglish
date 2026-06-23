"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { updateEventCollectBirthDateAction } from "@/app/[locale]/dashboard/admin/events/eventRegistrationSettingsActions";

interface EventFormCollectBirthDateToggleProps {
  locale: string;
  eventId: string;
  collectBirthDate: boolean;
  labels: {
    title: string;
    lead: string;
    checkboxLabel: string;
    errorSave: string;
  };
}

export function EventFormCollectBirthDateToggle({
  locale,
  eventId,
  collectBirthDate,
  labels,
}: EventFormCollectBirthDateToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await updateEventCollectBirthDateAction({
        locale,
        eventId,
        collectBirthDate: checked,
      });
      if (!result.ok) return;
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="inline-flex items-start gap-2">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
        </div>
      </div>
      <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={collectBirthDate}
          onChange={(event) => handleChange(event.currentTarget.checked)}
          disabled={pending}
          className="h-4 w-4 rounded border-[var(--color-border)]"
        />
        {labels.checkboxLabel}
      </label>
    </section>
  );
}
