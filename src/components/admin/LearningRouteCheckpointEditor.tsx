"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";

export type RouteCheckpointDraft = {
  id?: string | null;
  edgeId: string;
  assessmentId?: string | null;
  enabled: boolean;
  title: string;
  assessmentKind: "entry" | "exit" | "formative" | "mini_test" | "diagnostic";
  gradingMode: "numeric" | "pass_fail" | "diagnostic" | "rubric" | "manual_feedback";
  instructions: string;
  isRequired: boolean;
  isPriority: boolean;
  blocksProgress: boolean;
  maxScore: number | null;
  passingScore: number | null;
  weight: number | null;
};

interface LearningRouteCheckpointEditorProps {
  checkpoint: RouteCheckpointDraft | null;
  labels: Dictionary["dashboard"]["adminContents"];
  onChange: (checkpoint: RouteCheckpointDraft) => void;
}

const assessmentKinds: RouteCheckpointDraft["assessmentKind"][] = ["mini_test", "formative", "diagnostic", "entry", "exit"];
const gradingModes: RouteCheckpointDraft["gradingMode"][] = ["diagnostic", "numeric", "pass_fail", "rubric", "manual_feedback"];

export function LearningRouteCheckpointEditor({
  checkpoint,
  labels,
  onChange,
}: LearningRouteCheckpointEditorProps) {
  if (!checkpoint) {
    return (
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.routeGraphCheckpointTitle}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.routeGraphSelectEdge}</p>
      </section>
    );
  }

  const update = (next: Partial<RouteCheckpointDraft>) => onChange({ ...checkpoint, ...next });

  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.routeGraphCheckpointTitle}</h3>
      <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input type="checkbox" checked={checkpoint.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
        {labels.routeGraphCheckpointEnabled}
      </label>
      {checkpoint.enabled ? (
        <div className="space-y-3">
          <Field label={labels.routeGraphAssessmentTitle}>
            <input value={checkpoint.title} onChange={(event) => update({ title: event.target.value })} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={labels.routeGraphAssessmentKind}>
              <select value={checkpoint.assessmentKind} onChange={(event) => update({ assessmentKind: event.target.value as RouteCheckpointDraft["assessmentKind"] })} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
                {assessmentKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
              </select>
            </Field>
            <Field label={labels.routeGraphGradingMode}>
              <select value={checkpoint.gradingMode} onChange={(event) => update({ gradingMode: event.target.value as RouteCheckpointDraft["gradingMode"] })} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
                {gradingModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select>
            </Field>
          </div>
          <Field label={labels.routeGraphInstructions}>
            <textarea value={checkpoint.instructions} onChange={(event) => update({ instructions: event.target.value })} className="min-h-20 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
            <NumberField label={labels.routeGraphMaxScore} value={checkpoint.maxScore} onChange={(maxScore) => update({ maxScore })} />
            <NumberField label={labels.routeGraphPassingScore} value={checkpoint.passingScore} onChange={(passingScore) => update({ passingScore })} />
            <NumberField label={labels.routeGraphWeight} value={checkpoint.weight} onChange={(weight) => update({ weight })} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle label={labels.routeGraphRequired} checked={checkpoint.isRequired} onChange={(isRequired) => update({ isRequired })} />
            <Toggle label={labels.routeGraphPriority} checked={checkpoint.isPriority} onChange={(isPriority) => update({ isPriority })} />
            <Toggle label={labels.routeGraphBlocksProgress} checked={checkpoint.blocksProgress} onChange={(blocksProgress) => update({ blocksProgress })} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-[var(--color-foreground)]">{label}<span className="mt-1 block">{children}</span></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <Field label={label}>
      <input type="number" value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
    </Field>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 text-xs text-[var(--color-foreground)]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
