"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { saveLearningRouteAction } from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import type { ContentActionFailureCode } from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import type { LearningRouteModel } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRouteEditorProps {
  locale: string;
  route: LearningRouteModel | null;
  labels: Dictionary["dashboard"]["adminContents"];
  isWizardStart: boolean;
}

export function AdminLearningRouteEditor({
  locale,
  route,
  labels,
  isWizardStart,
}: AdminLearningRouteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(route?.title ?? "");
  const [teacherObjectives, setTeacherObjectives] = useState(route?.teacherObjectives ?? "");
  const [generalScope, setGeneralScope] = useState(route?.generalScope ?? "");
  const [evaluationCriteria, setEvaluationCriteria] = useState(route?.evaluationCriteria ?? "");
  const [saveErrorCode, setSaveErrorCode] = useState<ContentActionFailureCode | null>(null);
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 xl:col-span-2">
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {isWizardStart ? labels.routeWizardDetailsTitle : labels.routeEditorTitle}
        </h3>
        {isWizardStart ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.routeWizardDetailsLead}</p>
        ) : null}
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.routeNamePlaceholder} />
      <TextBlock label={labels.teacherObjectives} value={teacherObjectives} onChange={setTeacherObjectives} />
      <TextBlock label={labels.generalScope} value={generalScope} onChange={setGeneralScope} />
      <TextBlock label={labels.evaluationCriteria} value={evaluationCriteria} onChange={setEvaluationCriteria} />
      {saveErrorCode ? (
        <p className="text-sm font-medium text-[var(--color-error)]" role="alert">
          {routeSaveErrorMessage(saveErrorCode, labels)}
        </p>
      ) : null}
      <Button
        type="button"
        onClick={() => startTransition(() => {
          void (async () => {
            setSaveErrorCode(null);
            const result = await saveLearningRouteAction({
              locale,
              routeId: route?.id ?? null,
              title,
              teacherObjectives,
              generalScope,
              evaluationCriteria,
            });
            if (!result.ok) {
              setSaveErrorCode(result.code);
              return;
            }
            if (!route?.id) {
              router.replace(`/${locale}/dashboard/admin/academic/contents/sections/${result.id}/edit?graph=1`);
            }
            router.refresh();
          })();
        })}
        isLoading={isPending}
        disabled={!title.trim()}
      >
        <Save className="h-4 w-4" aria-hidden />
        {route?.id ? labels.saveRoute : labels.nextToRouteGraph}
      </Button>
    </section>
  );
}

function routeSaveErrorMessage(
  code: ContentActionFailureCode,
  labels: Dictionary["dashboard"]["adminContents"],
) {
  if (code === "invalid_input") return labels.routeWizardSaveErrorInvalidInput;
  if (code === "duplicate_title") return labels.routeWizardSaveErrorDuplicateTitle;
  if (code === "schema_not_ready") return labels.routeWizardSaveErrorSchemaNotReady;
  if (code === "forbidden") return labels.routeWizardSaveErrorForbidden;
  return labels.routeWizardSaveErrorPersistFailed;
}

function TextBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-foreground)]">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 min-h-24 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
    </label>
  );
}
