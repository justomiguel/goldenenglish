"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { AcademicRolloverWizard } from "@/components/organisms/AcademicRolloverWizard";
import {
  AcademicNewSectionModal,
  type AcademicNewSectionModalDict,
} from "@/components/organisms/AcademicNewSectionModal";
import {
  AcademicCopySectionsModal,
  type AcademicCopySectionsModalDict,
} from "@/components/organisms/AcademicCopySectionsModal";
import type { AcademicRolloverWizardProps } from "@/components/organisms/AcademicRolloverWizard";

export interface CohortSectionsToolbarProps {
  locale: string;
  cohortId: string;
  newSectionButton: string;
  newSectionButtonTip?: string;
  newSectionModalDict: AcademicNewSectionModalDict;
  defaultSectionMaxStudents: number;
  teachers: { id: string; label: string }[];
  rollover: Omit<AcademicRolloverWizardProps, "locale" | "cohortId">;
  copySectionsButton?: string;
  copySectionsButtonTip?: string;
  copySectionsModalDict?: AcademicCopySectionsModalDict;
  copySectionsSourceOptions?: { id: string; label: string }[];
}

export function CohortSectionsToolbar({
  locale,
  cohortId,
  newSectionButton,
  newSectionButtonTip,
  newSectionModalDict,
  defaultSectionMaxStudents,
  teachers,
  rollover,
  copySectionsButton,
  copySectionsButtonTip,
  copySectionsModalDict,
  copySectionsSourceOptions = [],
}: CohortSectionsToolbarProps) {
  const [open, setOpen] = useState(false);
  const [openCopy, setOpenCopy] = useState(false);
  const showCopy =
    copySectionsButton &&
    copySectionsModalDict &&
    copySectionsSourceOptions.length > 0;

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Button
          type="button"
          className="min-h-[44px]"
          title={newSectionButtonTip}
          onClick={() => setOpen(true)}
        >
          {newSectionButton}
        </Button>
        {showCopy ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px]"
            title={copySectionsButtonTip}
            onClick={() => setOpenCopy(true)}
          >
            {copySectionsButton}
          </Button>
        ) : null}
        <AcademicRolloverWizard locale={locale} cohortId={cohortId} {...rollover} />
      </div>
      <AcademicNewSectionModal
        locale={locale}
        cohortId={cohortId}
        open={open}
        onOpenChange={setOpen}
        teachers={teachers}
        defaultMaxStudents={defaultSectionMaxStudents}
        dict={newSectionModalDict}
      />
      {showCopy && copySectionsModalDict ? (
        <AcademicCopySectionsModal
          locale={locale}
          targetCohortId={cohortId}
          open={openCopy}
          onOpenChange={setOpenCopy}
          sourceCohortOptions={copySectionsSourceOptions}
          dict={copySectionsModalDict}
        />
      ) : null}
    </>
  );
}
