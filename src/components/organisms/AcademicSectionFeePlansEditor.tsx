"use client";

import { useState } from "react";
import { Archive, ArchiveX, Plus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  DEFAULT_SECTION_FEE_PLAN_CURRENCY,
  type SectionFeePlan,
  type SectionFeePlanWithUsage,
} from "@/types/sectionFeePlan";
import { Button } from "@/components/atoms/Button";
import {
  AcademicSectionFeePlanForm,
  type SectionFeePlanFormValues,
} from "@/components/organisms/AcademicSectionFeePlanForm";
import { AcademicSectionFeePlanRow } from "@/components/molecules/AcademicSectionFeePlanRow";
import { useSectionFeePlansEditor } from "@/hooks/useSectionFeePlansEditor";

type FeePlansDict = Dictionary["dashboard"]["academicSectionPage"]["feePlans"];

export interface AcademicSectionFeePlansEditorProps {
  locale: string;
  sectionId: string;
  initialPlans: SectionFeePlanWithUsage[];
  dict: FeePlansDict;
}

const valuesFromPlan = (p: SectionFeePlan): SectionFeePlanFormValues => ({
  effectiveFromYear: p.effectiveFromYear,
  effectiveFromMonth: p.effectiveFromMonth,
  monthlyFee: p.monthlyFee,
  currency: p.currency,
});

const todayDefaults = (
  fromPlans: readonly SectionFeePlan[],
): SectionFeePlanFormValues => {
  const now = new Date();
  const inheritedCurrency =
    fromPlans
      .slice()
      .sort((a, b) =>
        b.effectiveFromYear - a.effectiveFromYear !== 0
          ? b.effectiveFromYear - a.effectiveFromYear
          : b.effectiveFromMonth - a.effectiveFromMonth,
      )[0]?.currency ?? DEFAULT_SECTION_FEE_PLAN_CURRENCY;
  return {
    effectiveFromYear: now.getFullYear(),
    effectiveFromMonth: now.getMonth() + 1,
    monthlyFee: 0,
    currency: inheritedCurrency,
  };
};

const nextEffectiveFrom = (p: SectionFeePlan): { year: number; month: number } => {
  const m = p.effectiveFromMonth + 1;
  return m > 12
    ? { year: p.effectiveFromYear + 1, month: 1 }
    : { year: p.effectiveFromYear, month: m };
};

export function AcademicSectionFeePlansEditor({
  locale,
  sectionId,
  initialPlans,
  dict,
}: AcademicSectionFeePlansEditorProps) {
  const editor = useSectionFeePlansEditor({ locale, sectionId, initialPlans, dict });
  const [creating, setCreating] = useState<SectionFeePlanFormValues | null>(null);

  const startEdit = (plan: SectionFeePlanWithUsage) => {
    editor.setEditingId(plan.id);
    setCreating(null);
    editor.clearError();
  };

  const startCreate = () => {
    setCreating(todayDefaults(editor.plans));
    editor.setEditingId(null);
    editor.clearError();
  };

  const startDuplicate = (plan: SectionFeePlanWithUsage) => {
    const nextEff = nextEffectiveFrom(plan);
    setCreating({
      ...valuesFromPlan(plan),
      effectiveFromYear: nextEff.year,
      effectiveFromMonth: nextEff.month,
    });
    editor.setEditingId(null);
    editor.clearError();
  };

  const handleUpsert = (planId: string | null, values: SectionFeePlanFormValues) => {
    editor.upsert(planId, values);
    if (planId === null) setCreating(null);
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>

      {editor.visiblePlans.length === 0 && !creating ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {editor.visiblePlans.map((plan) => (
            <li
              key={plan.id}
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              {editor.editingId === plan.id ? (
                <>
                  {plan.inUse ? (
                    <p className="mb-2 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] p-2 text-xs text-[var(--color-foreground)]">
                      {dict.editingInUseWarning}
                    </p>
                  ) : null}
                  <AcademicSectionFeePlanForm
                    idPrefix={`fp-${plan.id}`}
                    initialValues={valuesFromPlan(plan)}
                    dict={dict}
                    submitLabel={dict.save}
                    busy={editor.pending}
                    errorMessage={editor.errorMessage}
                    onSubmit={(v) => handleUpsert(plan.id, v)}
                    onCancel={() => {
                      editor.setEditingId(null);
                      editor.clearError();
                    }}
                  />
                </>
              ) : (
                <AcademicSectionFeePlanRow
                  plan={plan}
                  dict={dict}
                  pending={editor.pending}
                  onEdit={startEdit}
                  onDuplicate={startDuplicate}
                  onArchive={editor.archive}
                  onRestore={editor.restore}
                  onDelete={editor.remove}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {editor.errorMessage && editor.editingId === null && !creating ? (
        <p className="mt-3 text-sm text-[var(--color-error)]" role="status">
          {editor.errorMessage}
        </p>
      ) : null}

      {creating ? (
        <div className="mt-4">
          <AcademicSectionFeePlanForm
            idPrefix="fp-new"
            initialValues={creating}
            dict={dict}
            submitLabel={dict.create}
            busy={editor.pending}
            errorMessage={editor.errorMessage}
            onSubmit={(v) => handleUpsert(null, v)}
            onCancel={() => {
              setCreating(null);
              editor.clearError();
            }}
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={startCreate} className="min-h-[44px]">
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {dict.add}
          </Button>
          {editor.archivedCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => editor.setShowArchived(!editor.showArchived)}
              className="min-h-[44px]"
            >
              {editor.showArchived ? (
                <ArchiveX className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Archive className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {editor.showArchived
                ? dict.hideArchived
                : `${dict.showArchived} (${editor.archivedCount})`}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
