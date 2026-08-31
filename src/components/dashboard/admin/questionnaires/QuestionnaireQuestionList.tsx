"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { QuestionnaireQuestionEditPanel } from "@/components/dashboard/admin/questionnaires/QuestionnaireQuestionEditPanel";
import {
  archiveQuestionnaireQuestionAction,
  reorderQuestionnaireQuestionAction,
} from "@/app/[locale]/dashboard/admin/settings/questionnaires/questionActions";
import { pickI18n } from "@/lib/questionnaires/pickI18n";
import type { QuestionnaireQuestion } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireQuestionList({
  locale,
  questionnaireId,
  questions,
  labels,
}: {
  locale: string;
  questionnaireId: string;
  questions: QuestionnaireQuestion[];
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const active = questions.filter((q) => !q.archivedAt);
  if (active.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{labels.questionsEmpty}</p>;
  }

  return (
    <ul className="space-y-3">
      {active.map((question, index) => (
        <li
          key={question.id}
          className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{pickI18n(question.promptI18n, locale)}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {labels.types[question.questionType]}
              {question.required ? ` · ${labels.requiredLabel}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditingId(editingId === question.id ? null : question.id)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {labels.editQuestion}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending || index === 0}
              aria-label={labels.moveUp}
              onClick={() =>
                startTransition(async () => {
                  await reorderQuestionnaireQuestionAction({
                    locale,
                    questionnaireId,
                    questionId: question.id,
                    direction: "up",
                  });
                  router.refresh();
                })
              }
            >
              <ChevronUp className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending || index === active.length - 1}
              aria-label={labels.moveDown}
              onClick={() =>
                startTransition(async () => {
                  await reorderQuestionnaireQuestionAction({
                    locale,
                    questionnaireId,
                    questionId: question.id,
                    direction: "down",
                  });
                  router.refresh();
                })
              }
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await archiveQuestionnaireQuestionAction(locale, question.id, questionnaireId);
                  router.refresh();
                })
              }
            >
              <Archive className="h-4 w-4" aria-hidden />
              {labels.archiveQuestion}
            </Button>
          </div>
          </div>
          {editingId === question.id ? (
            <QuestionnaireQuestionEditPanel
              locale={locale}
              questionnaireId={questionnaireId}
              question={question}
              labels={labels}
              onClose={() => setEditingId(null)}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
