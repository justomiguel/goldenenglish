"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  exportEventDiscountCodesAction,
  generateEventDiscountCodesAction,
  importEventDiscountCodesAction,
  saveEventDiscountCodeAction,
} from "@/app/[locale]/dashboard/admin/events/eventDiscountCodeActions";
import type { AdminEventDiscountCodeLabels } from "@/components/dashboard/admin/events/adminEventDiscountCodeLabels";

interface AdminEventDiscountCodeEditorProps {
  locale: string;
  eventId: string;
  labels: AdminEventDiscountCodeLabels;
}

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]";

function LabeledInput({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
      <input
        aria-label={label}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function errorText(labels: AdminEventDiscountCodeLabels, code: string | undefined): string {
  if (!code) return labels.error;
  return labels.errors[code as keyof AdminEventDiscountCodeLabels["errors"]] ?? labels.error;
}

function saveWorkbook(base64: string): void {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "discount-codes.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminEventDiscountCodeEditor({ locale, eventId, labels }: AdminEventDiscountCodeEditorProps) {
  const router = useRouter();
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [code, setCode] = useState("");
  const [uses, setUses] = useState("1");
  const [percent, setPercent] = useState("10");
  const [amount, setAmount] = useState("");
  const [tickets, setTickets] = useState("1");
  const [quantity, setQuantity] = useState("10");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(
    task: () => Promise<{
      ok: boolean;
      code?: string;
      downloadBase64?: string;
      errors?: { row: number; code: string }[];
    }>,
  ) {
    setPending(true);
    setMessage(null);
    const result = await task();
    setPending(false);
    if (result.downloadBase64) saveWorkbook(result.downloadBase64);
    if (!result.ok) {
      setMessage(errorText(labels, result.code));
      return;
    }
    const rowErrors = (result.errors ?? []).map((error) => errorText(labels, error.code));
    setMessage(rowErrors.length > 0 ? rowErrors.join(" ") : labels.saved);
    router.refresh();
  }

  const payload = { locale, eventId, kind, code, uses, percent, amount, tickets };

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--color-foreground)]">{labels.modeLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {(["percent", "amount"] as const).map((option) => (
            <label key={option} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 text-sm">
              <input
                type="radio"
                name="discount-kind"
                checked={kind === option}
                onChange={() => setKind(option)}
              />
              {option === "percent" ? labels.modePercent : labels.modeAmount}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid items-end gap-3 md:grid-cols-4">
        <LabeledInput label={labels.code} value={code} onChange={setCode} />
        <LabeledInput label={labels.uses} value={uses} onChange={setUses} />
        {kind === "percent" ? (
          <LabeledInput label={labels.percent} value={percent} onChange={setPercent} />
        ) : (
          <>
            <LabeledInput label={labels.amount} value={amount} onChange={setAmount} />
            <LabeledInput label={labels.tickets} value={tickets} onChange={setTickets} />
          </>
        )}
        <Button type="button" disabled={pending} onClick={() => void run(() => saveEventDiscountCodeAction(payload))}>
          <Plus className="h-4 w-4" aria-hidden />
          {labels.add}
        </Button>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{kind === "amount" ? labels.amountHint : labels.usesHint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 text-sm">
          <Upload className="h-4 w-4" aria-hidden />
          {labels.importFile}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = String(reader.result ?? "").split(",")[1] ?? "";
                void run(() => importEventDiscountCodesAction({ locale, eventId, kind, fileBase64: base64 }));
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => void run(() => exportEventDiscountCodesAction({ locale, eventId, kind }))}
        >
          <Download className="h-4 w-4" aria-hidden />
          {labels.exportFile}
        </Button>
        <LabeledInput label={labels.quantity} value={quantity} onChange={setQuantity} className="w-28" />
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => void run(() => generateEventDiscountCodesAction({ ...payload, quantity: Number(quantity) }))}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {labels.generate}
        </Button>
      </div>
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
    </div>
  );
}
