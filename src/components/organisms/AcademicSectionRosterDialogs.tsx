"use client";

import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";
import { SectionMoveCarryModal, type SectionMoveCarryCopy } from "@/components/organisms/SectionMoveCarryModal";
import type { SectionMoveCarryFacts } from "@/lib/academics/loadSectionMoveCarryFacts";
import type { CarryResolution, SectionMoveCarryFlags } from "@/lib/academics/planSectionMoveCarry";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";

export function AcademicSectionRosterDialogs({
  locale,
  carryOpen,
  facts,
  carryCopy,
  missingChoice,
  unknownError,
  busy,
  onCarryClose,
  onConfirmCarry,
  conflictOpen,
  conflictDict,
  conflicts,
  targetSlots,
  targetLabel,
  onConflictClose,
  onConfirmDrop,
}: {
  locale: string;
  carryOpen: boolean;
  facts: SectionMoveCarryFacts | null;
  carryCopy: SectionMoveCarryCopy;
  missingChoice: string;
  unknownError: string;
  busy: boolean;
  onCarryClose: () => void;
  onConfirmCarry: (flags: SectionMoveCarryFlags, choices: CarryResolution[]) => void;
  conflictOpen: boolean;
  conflictDict: {
    title: string;
    lead: string;
    currentSection: string;
    newSection: string;
    slotLegend: string;
    cancel: string;
    confirmDrop: string;
    pending: string;
  };
  conflicts: SectionEnrollmentConflict[] | null;
  targetSlots: SectionScheduleSlot[];
  targetLabel: string;
  onConflictClose: () => void;
  onConfirmDrop: (enrollmentId: string) => void;
}) {
  return (
    <>
      <SectionMoveCarryModal
        open={carryOpen}
        locale={locale}
        copy={carryCopy}
        missingChoice={missingChoice}
        unknownError={unknownError}
        facts={facts}
        busy={busy}
        onClose={onCarryClose}
        onConfirm={onConfirmCarry}
      />
      <ScheduleConflictResolutionModal
        open={conflictOpen}
        onClose={onConflictClose}
        locale={locale}
        dict={conflictDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={targetLabel}
        onConfirmDrop={onConfirmDrop}
        isPending={busy}
      />
    </>
  );
}
