"use client";

import { Modal } from "@/components/atoms/Modal";
import { AcademicSectionStaffEditorLeadBlock } from "@/components/organisms/AcademicSectionStaffEditorLeadBlock";
import { AcademicSectionStaffEditorAssistantsBlock } from "@/components/organisms/AcademicSectionStaffEditorAssistantsBlock";
import { AcademicSectionStaffEditorExternalBlock } from "@/components/organisms/AcademicSectionStaffEditorExternalBlock";
import type { AcademicSectionStaffEditorDict } from "@/components/organisms/academicSectionStaffEditorTypes";
import type {
  SectionStaffPortalPickOption,
  SectionStaffProfileAssistant,
} from "@/lib/academics/loadAdminSectionTeachersAndAssistants";

export type AcademicSectionStaffModalKind = "lead" | "assistants" | "external";

export interface AcademicSectionStaffEditorModalsProps {
  openModal: AcademicSectionStaffModalKind | null;
  onClose: (which: AcademicSectionStaffModalKind) => void;
  sectionId: string;
  teachers: { id: string; label: string }[];
  assistantPortalStaffOptions: SectionStaffPortalPickOption[];
  initialAssistants: SectionStaffProfileAssistant[];
  teacherId: string;
  onTeacherChange: (id: string) => void;
  pendingLead: boolean;
  dirtyLead: boolean;
  onSaveLead: () => void;
  msgLead: string | null;
  assistantIds: string[];
  assistantExtras: Record<string, { label: string; role: string }>;
  onAssistantIdsChange: (ids: string[]) => void;
  onAssistantExtrasChange: (next: Record<string, { label: string; role: string }>) => void;
  pendingAsst: boolean;
  dirtyAsst: boolean;
  onSaveAssistants: () => void;
  msgAsst: string | null;
  externalNames: string[];
  newExternalName: string;
  onNewExternalNameChange: (v: string) => void;
  onRemoveExternalName: (name: string) => void;
  onAddExternal: () => void;
  pendingExt: boolean;
  dirtyExt: boolean;
  onSaveExternal: () => void;
  msgExt: string | null;
  dict: AcademicSectionStaffEditorDict;
}

export function AcademicSectionStaffEditorModals({
  openModal,
  onClose,
  sectionId,
  teachers,
  assistantPortalStaffOptions,
  initialAssistants,
  teacherId,
  onTeacherChange,
  pendingLead,
  dirtyLead,
  onSaveLead,
  msgLead,
  assistantIds,
  assistantExtras,
  onAssistantIdsChange,
  onAssistantExtrasChange,
  pendingAsst,
  dirtyAsst,
  onSaveAssistants,
  msgAsst,
  externalNames,
  newExternalName,
  onNewExternalNameChange,
  onRemoveExternalName,
  onAddExternal,
  pendingExt,
  dirtyExt,
  onSaveExternal,
  msgExt,
  dict,
}: AcademicSectionStaffEditorModalsProps) {
  if (openModal === "lead") {
    return (
      <Modal
        open
        onOpenChange={(next) => {
          if (!next) onClose("lead");
        }}
        titleId="academic-section-staff-lead-modal-title"
        title={dict.leadModalTitle}
        disableClose={pendingLead}
        dialogClassName="max-w-lg"
      >
        <AcademicSectionStaffEditorLeadBlock
          sectionId={sectionId}
          teachers={teachers}
          teacherId={teacherId}
          onTeacherChange={onTeacherChange}
          pendingLead={pendingLead}
          dirtyLead={dirtyLead}
          onSaveLead={onSaveLead}
          msgLead={msgLead}
          dict={dict}
        />
      </Modal>
    );
  }

  if (openModal === "assistants") {
    return (
      <Modal
        open
        onOpenChange={(next) => {
          if (!next) onClose("assistants");
        }}
        titleId="academic-section-staff-assistants-modal-title"
        title={dict.assistantsModalTitle}
        disableClose={pendingAsst}
        dialogClassName="max-w-lg"
      >
        <AcademicSectionStaffEditorAssistantsBlock
          sectionId={sectionId}
          teachers={teachers}
          assistantPortalStaffOptions={assistantPortalStaffOptions}
          initialAssistants={initialAssistants}
          assistantIds={assistantIds}
          assistantExtras={assistantExtras}
          onAssistantIdsChange={onAssistantIdsChange}
          onAssistantExtrasChange={onAssistantExtrasChange}
          teacherId={teacherId}
          pendingAsst={pendingAsst}
          dirtyAsst={dirtyAsst}
          onSaveAssistants={onSaveAssistants}
          msgAsst={msgAsst}
          dict={dict}
        />
      </Modal>
    );
  }

  if (openModal === "external") {
    return (
      <Modal
        open
        onOpenChange={(next) => {
          if (!next) onClose("external");
        }}
        titleId="academic-section-staff-external-modal-title"
        title={dict.externalModalTitle}
        disableClose={pendingExt}
        dialogClassName="max-w-lg"
      >
        <AcademicSectionStaffEditorExternalBlock
          sectionId={sectionId}
          externalNames={externalNames}
          newExternalName={newExternalName}
          onNewExternalNameChange={onNewExternalNameChange}
          onRemoveName={onRemoveExternalName}
          onAddExternal={onAddExternal}
          pendingExt={pendingExt}
          dirtyExt={dirtyExt}
          onSaveExternal={onSaveExternal}
          msgExt={msgExt}
          dict={dict}
        />
      </Modal>
    );
  }

  return null;
}
