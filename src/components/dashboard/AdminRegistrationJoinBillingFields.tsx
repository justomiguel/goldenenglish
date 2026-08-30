"use client";

import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import { formatJoinBillingPreview } from "@/lib/billing/formatJoinBillingPreview";
import { planJoinBillingMonths } from "@/lib/billing/planJoinBillingMonths";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

export type JoinBillingFieldLabels = {
  legend: string;
  current: string;
  behind: string;
  scholarship: string;
  percent: string;
  scopeJoinMonth: string;
  scopeRestOfCycle: string;
  previewExempt: string;
  previewPaid: string;
  previewDue: string;
  previewScholarship: string;
  required: string;
};

export function AdminRegistrationJoinBillingFields({
  locale,
  namePrefix,
  value,
  onChange,
  labels,
  cycleStartsOn,
  cycleEndsOn,
}: {
  locale: string;
  namePrefix: string;
  value: JoinBillingDisposition | null;
  onChange: (next: JoinBillingDisposition) => void;
  labels: JoinBillingFieldLabels;
  cycleStartsOn?: string | null;
  cycleEndsOn?: string | null;
}) {
  const now = new Date();
  const joinMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const plan = planJoinBillingMonths({
    sectionStartsOn: cycleStartsOn ?? null,
    sectionEndsOn: cycleEndsOn ?? null,
    joinYear: joinMonth.year,
    joinMonth: joinMonth.month,
  });
  const kind = value?.kind ?? null;
  const preview = formatJoinBillingPreview({
    locale,
    priorMonths: plan.priorMonths,
    joinMonth,
    joinIsBillable: plan.joinIsBillable,
    dispositionKind: kind ?? "behind",
    labels: {
      exempt: labels.previewExempt,
      paid: labels.previewPaid,
      due: labels.previewDue,
      scholarship: labels.previewScholarship,
      nonePrior: "",
    },
  });

  return (
    <fieldset className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
      <legend className="px-1 text-sm font-medium">{labels.legend}</legend>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="radio"
          name={`${namePrefix}-kind`}
          checked={kind === "current"}
          onChange={() => onChange({ kind: "current" })}
        />
        {labels.current}
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="radio"
          name={`${namePrefix}-kind`}
          checked={kind === "behind"}
          onChange={() => onChange({ kind: "behind" })}
        />
        {labels.behind}
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="radio"
          name={`${namePrefix}-kind`}
          checked={kind === "scholarship"}
          onChange={() =>
            onChange({ kind: "scholarship", percent: 100, scope: "join_month" })
          }
        />
        {labels.scholarship}
      </label>
      {value?.kind === "scholarship" ? (
        <div className="space-y-2 pl-6">
          <Label htmlFor={`${namePrefix}-pct`}>{labels.percent}</Label>
          <Input
            id={`${namePrefix}-pct`}
            type="number"
            min={1}
            max={100}
            value={value.percent}
            onChange={(e) =>
              onChange({
                kind: "scholarship",
                percent: Number(e.target.value) || 0,
                scope: value.scope,
              })
            }
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name={`${namePrefix}-scope`}
              checked={value.scope === "join_month"}
              onChange={() => onChange({ ...value, scope: "join_month" })}
            />
            {labels.scopeJoinMonth}
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name={`${namePrefix}-scope`}
              checked={value.scope === "rest_of_cycle"}
              onChange={() => onChange({ ...value, scope: "rest_of_cycle" })}
            />
            {labels.scopeRestOfCycle}
          </label>
        </div>
      ) : null}
      <p className="text-xs text-[var(--color-muted-foreground)]">{preview}</p>
    </fieldset>
  );
}
