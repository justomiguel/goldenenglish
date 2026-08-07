"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Route } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { updateAcademicSectionFeatureFlagsAction } from "@/app/[locale]/dashboard/admin/academic/sectionFeatureFlagActions";

type Dict = Dictionary["dashboard"]["academicSectionPage"]["featureFlags"];

export interface AcademicSectionFeatureFlagsEditorProps {
  locale: string;
  sectionId: string;
  initialRequiresEvaluationsToPass: boolean;
  initialUsesLearningRoute: boolean;
  dict: Dict;
  embedded?: boolean;
}

export function AcademicSectionFeatureFlagsEditor({
  locale,
  sectionId,
  initialRequiresEvaluationsToPass,
  initialUsesLearningRoute,
  dict,
  embedded = false,
}: AcademicSectionFeatureFlagsEditorProps) {
  const router = useRouter();
  const [requiresEvaluations, setRequiresEvaluations] = useState(initialRequiresEvaluationsToPass);
  const [usesLearningRoute, setUsesLearningRoute] = useState(initialUsesLearningRoute);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const persist = (next: {
    requiresEvaluationsToPass: boolean;
    usesLearningRoute: boolean;
  }) => {
    const prev = {
      requiresEvaluationsToPass: requiresEvaluations,
      usesLearningRoute,
    };
    setRequiresEvaluations(next.requiresEvaluationsToPass);
    setUsesLearningRoute(next.usesLearningRoute);
    setErrorMessage(null);
    setOkMessage(null);
    start(async () => {
      try {
        const res = await updateAcademicSectionFeatureFlagsAction({
          locale,
          sectionId,
          requiresEvaluationsToPass: next.requiresEvaluationsToPass,
          usesLearningRoute: next.usesLearningRoute,
        });
        if (!res.ok) {
          setRequiresEvaluations(prev.requiresEvaluationsToPass);
          setUsesLearningRoute(prev.usesLearningRoute);
          if (res.code === "has_evaluations") {
            setErrorMessage(dict.errorHasEvaluations);
            return;
          }
          if (res.code === "has_learning_route") {
            setErrorMessage(dict.errorHasLearningRoute);
            return;
          }
          setErrorMessage(dict.errorSave);
          return;
        }
        setOkMessage(dict.saved);
        router.refresh();
      } catch {
        setRequiresEvaluations(prev.requiresEvaluationsToPass);
        setUsesLearningRoute(prev.usesLearningRoute);
        setErrorMessage(dict.errorSave);
      }
    });
  };

  return (
    <div
      className={
        embedded
          ? ""
          : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      }
    >
      {!embedded ? (
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      ) : null}
      <p className={(embedded ? "" : "mt-1 ") + "text-sm text-[var(--color-muted-foreground)]"}>{dict.lead}</p>

      <div className="mt-3 space-y-4">
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
            checked={requiresEvaluations}
            onChange={(e) =>
              persist({
                requiresEvaluationsToPass: e.target.checked,
                usesLearningRoute,
              })
            }
            disabled={pending}
            aria-describedby={`section-flag-evaluations-help-${sectionId}`}
          />
          <span className="space-y-1">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
              <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
              {dict.evaluationsLabel}
            </span>
            <span
              id={`section-flag-evaluations-help-${sectionId}`}
              className="block text-xs text-[var(--color-muted-foreground)]"
            >
              {dict.evaluationsHelp}
            </span>
          </span>
        </label>

        <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
            checked={usesLearningRoute}
            onChange={(e) =>
              persist({
                requiresEvaluationsToPass: requiresEvaluations,
                usesLearningRoute: e.target.checked,
              })
            }
            disabled={pending}
            aria-describedby={`section-flag-route-help-${sectionId}`}
          />
          <span className="space-y-1">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
              <Route className="h-4 w-4 shrink-0" aria-hidden />
              {dict.learningRouteLabel}
            </span>
            <span
              id={`section-flag-route-help-${sectionId}`}
              className="block text-xs text-[var(--color-muted-foreground)]"
            >
              {dict.learningRouteHelp}
            </span>
          </span>
        </label>

        {errorMessage ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {okMessage ? (
          <p className="text-sm text-[var(--color-success)]" role="status">
            {okMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
