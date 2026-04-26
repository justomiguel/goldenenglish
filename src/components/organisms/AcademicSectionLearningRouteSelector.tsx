"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { saveSectionLearningRouteAction } from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import type {
  LearningRouteContentTemplateOption,
  SectionLearningRouteAssignment,
} from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

interface AcademicSectionLearningRouteSelectorProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  routes: LearningRouteContentTemplateOption[];
  assignment: SectionLearningRouteAssignment | null;
  dict: Dictionary["dashboard"]["academicSectionPage"]["learningRoute"];
}

export function AcademicSectionLearningRouteSelector({
  locale,
  cohortId,
  sectionId,
  routes,
  assignment,
  dict,
}: AcademicSectionLearningRouteSelectorProps) {
  const initialValue = assignment?.mode === "route" && assignment.learningRouteId
    ? assignment.learningRouteId
    : "free_flow";
  const [value, setValue] = useState(initialValue);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();
  const isFreeFlow = value === "free_flow";

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
      </header>
      <label className="block text-sm font-medium text-[var(--color-foreground)]">
        {dict.selectLabel}
        <select
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setMessage(null);
          }}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        >
          <option value="free_flow">{dict.freeFlowOption}</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>{route.title}</option>
          ))}
        </select>
      </label>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {isFreeFlow ? dict.freeFlowHelp : dict.routeHelp}
      </p>
      {routes.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.emptyRoutes}</p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-[var(--color-foreground)]" role="status">
          {message === "saved" ? dict.saved : dict.error}
        </p>
      ) : null}
      <Button
        type="button"
        isLoading={isPending}
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(() => {
            void (async () => {
              const result = await saveSectionLearningRouteAction({
                locale,
                cohortId,
                sectionId,
                mode: isFreeFlow ? "free_flow" : "route",
                learningRouteId: isFreeFlow ? null : value,
              });
              setMessage(result.ok ? "saved" : "error");
            })();
          });
        }}
      >
        <Save className="h-4 w-4 shrink-0" aria-hidden />
        {dict.save}
      </Button>
    </section>
  );
}
