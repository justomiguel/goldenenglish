"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Undo2, UserCheck } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { applyRegistrationFunnelBatchAction } from "@/app/[locale]/dashboard/admin/registrations/applyRegistrationFunnelBatchAction";
import { registrationFunnelBatchMessage } from "@/lib/register/registrationFunnelBatch";
import type { RegistrationFunnelStage } from "@/lib/register/registrationFunnelStage";
import type { Dictionary } from "@/types/i18n";

type FunnelLabels = Dictionary["admin"]["registrations"]["funnel"];

function fill(template: string, count: number): string {
  return template.replaceAll("{{count}}", String(count));
}

export function RegistrationFunnelBatchBar({
  locale,
  stage,
  labels,
  selectedIds,
  allMarked,
  pageHasRows,
  onTogglePage,
  onClear,
}: {
  locale: string;
  stage: RegistrationFunnelStage;
  labels: FunnelLabels;
  selectedIds: readonly string[];
  allMarked: boolean;
  pageHasRows: boolean;
  onTogglePage: () => void;
  onClear: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marking = stage === "registered";
  const count = selectedIds.length;

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await applyRegistrationFunnelBatchAction({
      locale,
      stage,
      registrationIds: [...selectedIds],
    });
    setBusy(false);
    setOpen(false);
    if (result.updated > 0) {
      onClear();
      router.refresh();
    }
    if (!result.ok) {
      setError(registrationFunnelBatchMessage(result, labels.errors, labels.unknownError));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full md:w-auto"
          disabled={!pageHasRows || busy}
          onClick={onTogglePage}
        >
          <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
          {allMarked ? labels.clearPage : labels.selectPage}
        </Button>
        <Button
          type="button"
          variant={marking ? "primary" : "secondary"}
          className="min-h-11 w-full md:w-auto"
          disabled={count === 0 || busy}
          onClick={() => setOpen(true)}
        >
          {marking ? (
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {marking ? labels.markPage : labels.stepBackPage}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmActionModal
        open={open}
        onOpenChange={setOpen}
        title={marking ? labels.batchConfirmTitleMark : labels.batchConfirmTitleBack}
        body={fill(marking ? labels.batchConfirmBodyMark : labels.batchConfirmBodyBack, count)}
        cancelLabel={labels.cancel}
        confirmLabel={labels.batchConfirm}
        confirmVariant={marking ? "primary" : "destructive"}
        busy={busy}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
