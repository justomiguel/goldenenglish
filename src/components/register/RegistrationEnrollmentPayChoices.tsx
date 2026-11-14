"use client";

import { useRef, useState } from "react";
import { Banknote, CreditCard, FolderOpen, Landmark, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { RegistrationMatriculaPayLeave } from "@/components/register/RegistrationMatriculaPayLeave";
import { EVENT_TRANSFER_RECEIPT_ACCEPT } from "@/lib/events/eventTransferReceiptLimits";
import type { RegistrationMatriculaPayActionLabels } from "@/components/register/RegistrationMatriculaPayActions";
import type { RegistrationPublicPayMethod } from "@/lib/register/resolveRegistrationPublicPayMethods";

const btnClass =
  "inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-60";

export function RegistrationEnrollmentPayChoices({
  methods,
  transferInstructions,
  labels,
  pending,
  receiptBusy,
  receiptOk,
  homeHref,
  leavingLabel,
  onFlow,
  onMercadoPago,
  onCash,
  onReceipt,
}: {
  methods: RegistrationPublicPayMethod[];
  transferInstructions: string | null;
  labels: RegistrationMatriculaPayActionLabels;
  pending: boolean;
  receiptBusy: boolean;
  receiptOk: boolean;
  homeHref?: string;
  leavingLabel?: string;
  onFlow: () => void;
  onMercadoPago: () => void;
  onCash: () => void;
  onReceipt: (data: FormData) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const online = methods.includes("flow") || methods.includes("mercadopago");
  return (
    <div className="space-y-6">
      <button type="button" className={btnClass} disabled={pending} onClick={onCash}>
        <Banknote className="h-4 w-4" aria-hidden />
        {labels.cash}
      </button>
      <div className="space-y-3">
        <p className="font-medium">{labels.online}</p>
        {methods.includes("flow") ? (
          <button type="button" className={btnClass} disabled={pending} onClick={onFlow}>
            <CreditCard className="h-4 w-4" aria-hidden />
            {labels.flow}
          </button>
        ) : null}
        {methods.includes("mercadopago") ? (
          <button type="button" className={btnClass} disabled={pending} onClick={onMercadoPago}>
            <Landmark className="h-4 w-4" aria-hidden />
            {labels.mercadoPago}
          </button>
        ) : null}
        {online ? null : <p className="text-sm text-[var(--color-muted-foreground)]">{labels.onlineEmpty}</p>}
      </div>
      <form
        className="space-y-3 rounded-lg border border-[var(--color-border)] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onReceipt(new FormData(event.currentTarget));
        }}
      >
        <p className="font-medium">{labels.uploadChoice}</p>
        {transferInstructions ? (
          <p className="whitespace-pre-wrap text-sm text-[var(--color-muted-foreground)]">
            {transferInstructions}
          </p>
        ) : null}
        {receiptOk ? (
          <>
            <p className="text-sm" role="status">
              {labels.receiptOk}
            </p>
            {homeHref && leavingLabel ? (
              <RegistrationMatriculaPayLeave href={homeHref} label={leavingLabel} />
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm">{labels.transferHint}</p>
            <input
              ref={fileRef}
              type="file"
              name="receipt"
              required
              accept={EVENT_TRANSFER_RECEIPT_ACCEPT}
              className="sr-only"
              aria-label={labels.chooseFile ?? labels.uploadChoice}
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            />
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full"
              onClick={() => fileRef.current?.click()}
            >
              <FolderOpen className="h-4 w-4" aria-hidden />
              {labels.chooseFile ?? labels.uploadChoice}
            </Button>
            {fileName ? <p className="text-sm">{fileName}</p> : null}
            {receiptBusy ? <InlineUploadProgressBar label={labels.uploadButton} indeterminate /> : null}
            <button type="submit" className={btnClass} disabled={pending || !fileName}>
              <Upload className="h-4 w-4" aria-hidden />
              {labels.uploadButton}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
