"use client";

import { useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export type BulkScholarshipScope = "all" | "selected" | "pending";

export interface SectionBulkScholarshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: {
    discountPercent: number;
    scope: BulkScholarshipScope;
    fromMonth: number;
    toMonth: number;
    note?: string;
  }) => void;
  busy: boolean;
  dict: CollectionsDict;
  studentCount: number;
  selectedStudentCount: number;
  year: number;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function SectionBulkScholarshipModal({
  open,
  onOpenChange,
  onConfirm,
  busy,
  dict,
  studentCount,
  selectedStudentCount,
  year,
}: SectionBulkScholarshipModalProps) {
  const [discountPercent, setDiscountPercent] = useState("");
  const [scope, setScope] = useState<BulkScholarshipScope>("all");
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const [note, setNote] = useState("");

  const d = dict.bulkScholarship;
  const monthLabels = dict.monthShort;

  const pctNum = Number(discountPercent);
  const pctValid = Number.isFinite(pctNum) && pctNum >= 1 && pctNum <= 100;
  const rangeValid = fromMonth <= toMonth;
  const canConfirm = pctValid && rangeValid;

  const affectedCount =
    scope === "all"
      ? studentCount
      : scope === "selected"
        ? selectedStudentCount
        : studentCount;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({
      discountPercent: pctNum,
      scope,
      fromMonth,
      toMonth,
      note: note.trim() || undefined,
    });
  }

  function handleClose() {
    setDiscountPercent("");
    setScope("all");
    setFromMonth(1);
    setToMonth(12);
    setNote("");
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && handleClose()} titleId="bulk-scholarship-modal-title" title={d.title}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{d.lead}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="bulk-scholarship-pct">{d.percentLabel}</Label>
            <Input
              id="bulk-scholarship-pct"
              type="number"
              min={1}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder={d.percentPlaceholder}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--color-foreground)]">
              {d.scopeLabel}
            </legend>
            <div className="flex flex-col gap-1.5">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scholarship-scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="accent-[var(--color-primary)]"
                />
                {d.scopeAll.replace("{count}", String(studentCount))}
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scholarship-scope"
                  value="selected"
                  checked={scope === "selected"}
                  onChange={() => setScope("selected")}
                  disabled={selectedStudentCount === 0}
                  className="accent-[var(--color-primary)]"
                />
                {d.scopeSelected.replace("{count}", String(selectedStudentCount))}
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scholarship-scope"
                  value="pending"
                  checked={scope === "pending"}
                  onChange={() => setScope("pending")}
                  className="accent-[var(--color-primary)]"
                />
                {d.scopePending}
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bulk-scholarship-from">{d.fromMonthLabel}</Label>
              <select
                id="bulk-scholarship-from"
                value={fromMonth}
                onChange={(e) => setFromMonth(Number(e.target.value))}
                className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {monthLabels[m - 1]} {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bulk-scholarship-to">{d.toMonthLabel}</Label>
              <select
                id="bulk-scholarship-to"
                value={toMonth}
                onChange={(e) => setToMonth(Number(e.target.value))}
                className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {monthLabels[m - 1]} {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!rangeValid ? (
            <p className="text-xs text-[var(--color-error)]">{d.invalidRange}</p>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="bulk-scholarship-note">{d.noteLabel}</Label>
            <Input
              id="bulk-scholarship-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={d.notePlaceholder}
            />
          </div>

          <p className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/30 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
            {d.preview
              .replace("{percent}", discountPercent || "0")
              .replace("{students}", String(affectedCount))
              .replace("{months}", String(toMonth - fromMonth + 1))}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={busy}>
            {d.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            isLoading={busy}
          >
            {d.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
