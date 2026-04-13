"use client";

import { useState, useTransition } from "react";
import { setCurrentCohortAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";
import { Button } from "@/components/atoms/Button";

interface AcademicCohortCurrentToggleProps {
  cohortId: string;
  locale: string;
  label: string;
}

export function AcademicCohortCurrentToggle({
  cohortId,
  locale,
  label,
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
      className="shrink-0 px-2 py-1 text-xs"
      disabled={pending}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
