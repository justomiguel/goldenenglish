"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { updateEventShowOnHomeAction } from "@/app/[locale]/dashboard/admin/events/eventShowOnHomeActions";

interface AdminEventShowOnHomeToggleProps {
  locale: string;
  eventId: string;
  showOnHome: boolean;
  labels: {
    title: string;
    lead: string;
    checkboxLabel: string;
    errorSave: string;
  };
}

export function AdminEventShowOnHomeToggle({
  locale,
  eventId,
  showOnHome,
  labels,
}: AdminEventShowOnHomeToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(checked: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateEventShowOnHomeAction({
        locale,
        eventId,
        showOnHome: checked,
      });
      if (!result.ok) {
        setError(labels.errorSave);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div className="inline-flex items-start gap-2">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
        </div>
      </div>
      <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={showOnHome}
          onChange={(event) => handleChange(event.currentTarget.checked)}
          disabled={pending}
          className="h-4 w-4 rounded border-[var(--color-border)]"
        />
        {labels.checkboxLabel}
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </section>
  );
}
