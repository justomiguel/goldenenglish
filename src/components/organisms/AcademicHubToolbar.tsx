"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  AcademicNewCohortModal,
  type AcademicNewCohortModalProps,
} from "@/components/organisms/AcademicNewCohortModal";
import {
  ADMIN_TOUR_ANCHORS,
  ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT,
} from "@/lib/admin-tutorials/selectors";

export interface AcademicHubToolbarProps {
  locale: string;
  dict: {
    newCohort: string;
    newCohortTip: string;
    newCohortModal: AcademicNewCohortModalProps["dict"];
  };
}

export function AcademicHubToolbar({ locale, dict }: AcademicHubToolbarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT, onOpen);
    return () => window.removeEventListener(ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT, onOpen);
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          title={dict.newCohortTip}
          className="inline-flex min-h-[44px] items-center gap-2"
          data-tour={ADMIN_TOUR_ANCHORS.newCohort}
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {dict.newCohort}
        </Button>
      </div>
      <AcademicNewCohortModal
        locale={locale}
        open={open}
        onOpenChange={setOpen}
        dict={dict.newCohortModal}
      />
    </div>
  );
}
