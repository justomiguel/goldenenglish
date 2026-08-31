"use client";

import { useState, useTransition } from "react";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { Button } from "@/components/atoms/Button";
import { QuestionnaireResultsCharts } from "@/components/dashboard/admin/questionnaires/QuestionnaireResultsCharts";
import { downloadQuestionnaireCsvAction } from "@/app/[locale]/dashboard/admin/settings/questionnaires/submitResultsCsvAction";
import { pickI18n } from "@/lib/questionnaires/pickI18n";
import { formatAnswerForCsv } from "@/lib/questionnaires/formatAnswerCsv";
import type { QuestionnaireResultsModel } from "@/lib/questionnaires/loadQuestionnaireResults";
import type { QuestionnaireRecord } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireResultsScreen({
  locale,
  questionnaire,
  model,
  labels,
}: {
  locale: string;
  questionnaire: QuestionnaireRecord;
  model: QuestionnaireResultsModel;
  labels: Labels;
}) {
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const title = pickI18n(questionnaire.titleI18n, locale);

  return (
    <div className="space-y-6">
      <AdminBackLink href={`/${locale}/dashboard/admin/settings/questionnaires/${questionnaire.id}`}>
        {labels.editorTitle}
      </AdminBackLink>
      <AdminPageHeader title={labels.resultsTitle} lead={labels.resultsLead} iconId="questionnaires" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.totalResponses.replace("{count}", String(model.responseCount))}
        {model.lastSubmittedAt
          ? ` · ${labels.lastResponse.replace("{date}", model.lastSubmittedAt.slice(0, 16).replace("T", " "))}`
          : ""}
      </p>
      <Button
        type="button"
        variant="secondary"
        isLoading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await downloadQuestionnaireCsvAction({
              locale,
              questionnaireId: questionnaire.id,
              anonymousLabel: labels.anonymous,
            });
            if (!result.ok) return;
            const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${questionnaire.slug}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          })
        }
      >
        {labels.exportCsv}
      </Button>
      {model.responseCount === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noResponses}</p>
      ) : (
        <QuestionnaireResultsCharts
          blocks={model.blocks}
          responseCount={model.responseCount}
          labels={labels}
        />
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{labels.individualTitle}</h2>
        <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)]">
          {model.responses.slice(0, 20).map((row) => (
            <li key={row.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{row.label}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {row.submittedAt.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpenId(openId === row.id ? null : row.id)}>
                  {labels.view}
                </Button>
              </div>
              {openId === row.id ? (
                <dl className="mt-3 space-y-2 text-sm">
                  {model.questions
                    .filter((q) => !q.archivedAt || (model.answersByResponse[row.id] ?? []).some((a) => a.questionId === q.id))
                    .map((question) => {
                      const answer = (model.answersByResponse[row.id] ?? []).find(
                        (a) => a.questionId === question.id,
                      );
                      return (
                        <div key={question.id}>
                          <dt className="text-[var(--color-muted-foreground)]">
                            {pickI18n(question.promptI18n, locale)}
                          </dt>
                          <dd>
                            {formatAnswerForCsv({
                              questionType: question.questionType,
                              valueText: answer?.valueText,
                              valueNumber: answer?.valueNumber,
                              valueOptions: answer?.valueOptions,
                            }) || "—"}
                          </dd>
                        </div>
                      );
                    })}
                </dl>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
