"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  addLearningRouteStepAction,
  createQuestionBankItemAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import type { LearningRouteModel } from "@/types/learningContent";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRouteStepFormsProps {
  locale: string;
  route: LearningRouteModel | null;
  workspace: LearningRouteWorkspace | null;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminLearningRouteStepForms({
  locale,
  route,
  workspace,
  labels,
}: AdminLearningRouteStepFormsProps) {
  const router = useRouter();
  const [contentTemplateId, setContentTemplateId] = useState(workspace?.contentTemplates[0]?.id ?? "");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddRouteStep = () => {
    if (!route?.id || !contentTemplateId) return;
    startTransition(async () => {
      const result = await addLearningRouteStepAction({
        locale,
        routeId: route.id,
        contentTemplateId,
        sortOrder: workspace?.routeSteps.length ?? 0,
      });
      if (result.ok) {
        router.refresh();
      }
    });
  };

  const handleAddQuestion = () => {
    if (!questionPrompt.trim()) return;
    startTransition(async () => {
      const result = await createQuestionBankItemAction({
        locale,
        prompt: questionPrompt,
        questionType: "true_false",
      });
      if (result.ok) {
        setQuestionPrompt("");
        router.refresh();
      }
    });
  };

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 xl:col-span-2">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.routeBuilderTitle}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
          <h4 className="font-medium text-[var(--color-foreground)]">{labels.addRouteStep}</h4>
          <select value={contentTemplateId} onChange={(e) => setContentTemplateId(e.target.value)} className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
            {workspace?.contentTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
          </select>
          <Button type="button" size="sm" onClick={handleAddRouteStep} disabled={!route?.id || !contentTemplateId || isPending}>
            <Plus className="h-4 w-4" aria-hidden />
            {labels.add}
          </Button>
        </div>
        <MiniForm title={labels.addQuestion} value={questionPrompt} onChange={setQuestionPrompt} onSubmit={handleAddQuestion} disabled={isPending} labels={labels} />
      </div>
    </section>
  );
}

function MiniForm({ title, value, onChange, onSubmit, disabled, labels }: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  return (
    <div className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
      <h4 className="font-medium text-[var(--color-foreground)]">{title}</h4>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      <Button type="button" size="sm" onClick={onSubmit} disabled={disabled || !value.trim()}>
        <Plus className="h-4 w-4" aria-hidden />
        {labels.add}
      </Button>
    </div>
  );
}
