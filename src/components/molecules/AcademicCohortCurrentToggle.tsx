"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { setCurrentCohortAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";
import { Button } from "@/components/atoms/Button";

interface AcademicCohortCurrentToggleProps {
  cohortId: string;
  locale: string;
  label: string;
  /** When true, shows a leading icon (hub and dense admin lists). */
  showIcon?: boolean;
}

export function AcademicCohortCurrentToggle({
  cohortId,
  locale,
  label,
  showIcon,
}: AcademicCohortCurrentToggleProps) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  function handleClick() {
    start(async () => {
      const res = await setCurrentCohortAction({ cohortId, locale });
      if (res.ok) setDone(true);
    });
  }

  if (done) return null;

  return (
    <Button
      variant="secondary"
      className={`shrink-0 text-xs ${showIcon ? "inline-flex min-h-[36px] items-center gap-1.5 px-2.5 py-1.5" : "px-2 py-1"}`}
      disabled={pending}
      onClick={handleClick}
    >
      {showIcon ? <Star className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {label}
    </Button>
  );
}
