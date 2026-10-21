"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { duplicateEventAction } from "@/app/[locale]/dashboard/admin/events/eventDuplicateAction";

interface AdminEventDuplicateButtonProps {
  locale: string;
  eventId: string;
  labels: { button: string; error: string };
}

export function AdminEventDuplicateButton({ locale, eventId, labels }: AdminEventDuplicateButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDuplicate() {
    setPending(true);
    setError(null);
    const result = await duplicateEventAction({ locale, eventId });
    setPending(false);
    if (!result.ok || !result.eventId) {
      setError(labels.error);
      return;
    }
    router.push(`/${locale}/dashboard/admin/events/${result.eventId}`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void onDuplicate()} disabled={pending}>
        <Copy className="h-4 w-4" aria-hidden />
        {labels.button}
      </Button>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
