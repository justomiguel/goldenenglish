"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { AdminLearningRouteEditor } from "@/components/admin/AdminLearningRouteEditor";
import { AdminLearningRouteStepForms } from "@/components/admin/AdminLearningRouteStepForms";
import { AdminLearningRouteStepsModal } from "@/components/admin/AdminLearningRouteStepsModal";
import { ContentPlanHealthSummary } from "@/components/molecules/ContentPlanHealthSummary";
import { LearningRouteWizardProgress } from "@/components/admin/LearningRouteWizardProgress";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRoutePlannerProps {
  locale: string;
  workspace: LearningRouteWorkspace | null;
  labels: Dictionary["dashboard"]["adminContents"];
  initialGraphOpen?: boolean;
}

export function AdminLearningRoutePlanner({
  locale,
  workspace,
  labels,
  initialGraphOpen = false,
}: AdminLearningRoutePlannerProps) {
  const route = workspace?.route ?? null;
  const isWizardStart = !route?.id;
  return (
    <div className="space-y-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <header>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{labels.learningRoutesTitle}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.learningRoutesLead}</p>
      </header>
      {isWizardStart || initialGraphOpen ? (
        <LearningRouteWizardProgress activeStep={initialGraphOpen ? 2 : 1} labels={labels} />
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {!isWizardStart && workspace ? <div className="xl:col-span-2"><ContentPlanHealthSummary health={workspace.health} labels={labels} /></div> : null}
        <AdminLearningRouteEditor locale={locale} route={route} labels={labels} isWizardStart={isWizardStart} />
        {!isWizardStart ? (
          <>
            <ContentSidePanel locale={locale} workspace={workspace} labels={labels} initialGraphOpen={initialGraphOpen} />
            <AdminLearningRouteStepForms locale={locale} route={route} workspace={workspace} labels={labels} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function ContentSidePanel({
  locale,
  workspace,
  labels,
  initialGraphOpen,
}: {
  locale: string;
  workspace: LearningRouteWorkspace | null;
  labels: Dictionary["dashboard"]["adminContents"];
  initialGraphOpen: boolean;
}) {
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(initialGraphOpen);
  return (
    <aside className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <List title={labels.routeStepsTitle} empty={labels.emptyRouteSteps} rows={workspace?.routeSteps.map((step) => step.contentTitle) ?? []} />
      {workspace?.route?.id ? (
        <>
          <Button type="button" size="sm" onClick={() => setIsStepsModalOpen(true)}>
            {labels.editRouteSteps}
          </Button>
          {isStepsModalOpen ? (
            <AdminLearningRouteStepsModal
              open={isStepsModalOpen}
              locale={locale}
              workspace={workspace}
              labels={labels}
              onOpenChange={setIsStepsModalOpen}
            />
          ) : null}
        </>
      ) : (
        <div className="space-y-2">
          <Button type="button" size="sm" disabled>
            {labels.editRouteSteps}
          </Button>
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.saveRouteBeforeEditingSteps}</p>
        </div>
      )}
      <List title={labels.questionsTitle} empty={labels.emptyQuestions} rows={workspace?.questions.map((q) => q.prompt) ?? []} />
      <List title={labels.assessmentsTitle} empty={labels.emptyAssessments} rows={workspace?.assessments.map((a) => a.title) ?? []} />
    </aside>
  );
}

function List({ title, empty, rows }: { title: string; empty: string; rows: string[] }) {
  const visible = useMemo(() => rows.slice(0, 6), [rows]);
  return (
    <section>
      <h3 className="font-semibold text-[var(--color-foreground)]">{title}</h3>
      {visible.length === 0 ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{empty}</p> : (
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted-foreground)]">{visible.map((row, idx) => <li key={`${row}:${idx}`}>{row}</li>)}</ul>
      )}
    </section>
  );
}
