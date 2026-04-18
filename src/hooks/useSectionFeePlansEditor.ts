"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { SectionFeePlanWithUsage } from "@/types/sectionFeePlan";
import type { SectionFeePlanFormValues } from "@/components/organisms/AcademicSectionFeePlanForm";
import { upsertSectionFeePlanAction } from "@/app/[locale]/dashboard/admin/academic/sectionFeePlanActions";
import {
  archiveSectionFeePlanAction,
  deleteSectionFeePlanAction,
  restoreSectionFeePlanAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionFeePlanLifecycleActions";

type FeePlansDict = Dictionary["dashboard"]["academicSectionPage"]["feePlans"];

interface UseSectionFeePlansEditorArgs {
  locale: string;
  sectionId: string;
  initialPlans: SectionFeePlanWithUsage[];
  dict: FeePlansDict;
}

export interface SectionFeePlansEditorState {
  plans: SectionFeePlanWithUsage[];
  visiblePlans: SectionFeePlanWithUsage[];
  archivedCount: number;
  pending: boolean;
  errorMessage: string | null;
  editingId: string | null;
  showArchived: boolean;
  setShowArchived: (next: boolean) => void;
  setEditingId: (next: string | null) => void;
  clearError: () => void;
  upsert: (planId: string | null, values: SectionFeePlanFormValues) => void;
  remove: (plan: SectionFeePlanWithUsage) => void;
  archive: (plan: SectionFeePlanWithUsage) => void;
  restore: (plan: SectionFeePlanWithUsage) => void;
}

export function useSectionFeePlansEditor({
  locale,
  sectionId,
  initialPlans,
  dict,
}: UseSectionFeePlansEditorArgs): SectionFeePlansEditorState & {
  setPlans: (next: SectionFeePlanWithUsage[]) => void;
} {
  const router = useRouter();
  const [plans, setPlans] = useState<SectionFeePlanWithUsage[]>(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) =>
        b.effectiveFromYear - a.effectiveFromYear !== 0
          ? b.effectiveFromYear - a.effectiveFromYear
          : b.effectiveFromMonth - a.effectiveFromMonth,
      ),
    [plans],
  );

  const visiblePlans = useMemo(
    () => sortedPlans.filter((p) => (showArchived ? true : !p.archivedAt)),
    [sortedPlans, showArchived],
  );

  const archivedCount = useMemo(
    () => sortedPlans.filter((p) => Boolean(p.archivedAt)).length,
    [sortedPlans],
  );

  const upsert = (planId: string | null, values: SectionFeePlanFormValues) => {
    setErrorMessage(null);
    start(async () => {
      const res = await upsertSectionFeePlanAction({
        locale,
        sectionId,
        planId: planId ?? undefined,
        ...values,
      });
      if (!res.ok) {
        setErrorMessage(dict.errorSave);
        return;
      }
      const next: SectionFeePlanWithUsage = {
        id: res.planId,
        sectionId,
        archivedAt: null,
        inUse: plans.find((p) => p.id === res.planId)?.inUse ?? false,
        ...values,
      };
      setPlans((prev) => [...prev.filter((p) => p.id !== res.planId), next]);
      setEditingId(null);
      router.refresh();
    });
  };

  const remove = (plan: SectionFeePlanWithUsage) => {
    setErrorMessage(null);
    start(async () => {
      const res = await deleteSectionFeePlanAction({ locale, sectionId, planId: plan.id });
      if (!res.ok) {
        setErrorMessage(res.code === "IN_USE" ? dict.errorInUse : dict.errorSave);
        return;
      }
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      router.refresh();
    });
  };

  const archive = (plan: SectionFeePlanWithUsage) => {
    setErrorMessage(null);
    start(async () => {
      const res = await archiveSectionFeePlanAction({ locale, sectionId, planId: plan.id });
      if (!res.ok) {
        setErrorMessage(dict.errorSave);
        return;
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, archivedAt: new Date().toISOString() } : p)),
      );
      router.refresh();
    });
  };

  const restore = (plan: SectionFeePlanWithUsage) => {
    setErrorMessage(null);
    start(async () => {
      const res = await restoreSectionFeePlanAction({ locale, sectionId, planId: plan.id });
      if (!res.ok) {
        setErrorMessage(dict.errorSave);
        return;
      }
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, archivedAt: null } : p)));
      router.refresh();
    });
  };

  return {
    plans,
    visiblePlans,
    archivedCount,
    pending,
    errorMessage,
    editingId,
    showArchived,
    setShowArchived,
    setEditingId,
    clearError: () => setErrorMessage(null),
    upsert,
    remove,
    archive,
    restore,
    setPlans,
  };
}
