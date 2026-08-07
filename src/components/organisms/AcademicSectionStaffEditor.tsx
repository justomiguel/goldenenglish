"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog, UserPlus, UserRoundPlus } from "lucide-react";
import {
  replaceAcademicSectionAssistantsAction,
  updateAcademicSectionTeacherAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionStaffActions";
import { replaceAcademicSectionExternalAssistantsAction } from "@/app/[locale]/dashboard/admin/academic/sectionExternalAssistantsActions";
import { Button } from "@/components/atoms/Button";
import {
  AcademicSectionStaffEditorModals,
  type AcademicSectionStaffModalKind,
} from "@/components/organisms/AcademicSectionStaffEditorModals";
import type { AcademicSectionStaffEditorDict } from "@/components/organisms/academicSectionStaffEditorTypes";
import type {
  SectionStaffPortalPickOption,
  SectionStaffProfileAssistant,
} from "@/lib/academics/loadAdminSectionTeachersAndAssistants";

export type { AcademicSectionStaffEditorDict } from "@/components/organisms/academicSectionStaffEditorTypes";

export interface AcademicSectionStaffEditorProps {
  locale: string;
  sectionId: string;
  teachers: { id: string; label: string }[];
  assistantPortalStaffOptions: SectionStaffPortalPickOption[];
  initialTeacherId: string;
  initialAssistants: SectionStaffProfileAssistant[];
  initialExternalAssistants: { id: string; label: string }[];
  dict: AcademicSectionStaffEditorDict;
  /** When true, omits outer card chrome and duplicate title (used inside area block). */
  embedded?: boolean;
}

export function AcademicSectionStaffEditor({
  locale,
  sectionId,
  teachers,
  assistantPortalStaffOptions,
  initialTeacherId,
  initialAssistants,
  initialExternalAssistants,
  dict,
  embedded = false,
}: AcademicSectionStaffEditorProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<AcademicSectionStaffModalKind | null>(null);
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [assistantIds, setAssistantIds] = useState<string[]>(() => initialAssistants.map((a) => a.id));
  const [assistantExtras, setAssistantExtras] = useState<Record<string, { label: string; role: string }>>(() =>
    Object.fromEntries(initialAssistants.map((a) => [a.id, { label: a.label, role: a.role }])),
  );
  const [externalNames, setExternalNames] = useState<string[]>(() =>
    initialExternalAssistants.map((e) => e.label),
  );
  const [newExternalName, setNewExternalName] = useState("");
  const [msgLead, setMsgLead] = useState<string | null>(null);
  const [msgAsst, setMsgAsst] = useState<string | null>(null);
  const [msgExt, setMsgExt] = useState<string | null>(null);
  const [pendingLead, startLead] = useTransition();
  const [pendingAsst, startAsst] = useTransition();
  const [pendingExt, startExt] = useTransition();

  const dirtyLead = teacherId !== initialTeacherId;
  const sortedAsst = [...assistantIds].sort();
  const sortedInitial = [...initialAssistants.map((a) => a.id)].sort();
  const dirtyAsst =
    sortedAsst.length !== sortedInitial.length || sortedAsst.some((id, i) => id !== sortedInitial[i]);
  const sortedExt = [...externalNames].map((s) => s.trim()).sort();
  const sortedInitialExt = [...initialExternalAssistants.map((e) => e.label.trim())].sort();
  const dirtyExt =
    sortedExt.length !== sortedInitialExt.length || sortedExt.some((n, i) => n !== sortedInitialExt[i]);

  const closeModal = (which: AcademicSectionStaffModalKind) => {
    if (which === "lead" && pendingLead) return;
    if (which === "assistants" && pendingAsst) return;
    if (which === "external" && pendingExt) return;
    if (which === "lead") {
      setTeacherId(initialTeacherId);
      setMsgLead(null);
    }
    if (which === "assistants") {
      setAssistantIds(initialAssistants.map((a) => a.id));
      setAssistantExtras(
        Object.fromEntries(initialAssistants.map((a) => [a.id, { label: a.label, role: a.role }])),
      );
      setMsgAsst(null);
    }
    if (which === "external") {
      setExternalNames(initialExternalAssistants.map((e) => e.label));
      setNewExternalName("");
      setMsgExt(null);
    }
    setOpenModal(null);
  };

  const saveLead = () => {
    setMsgLead(null);
    startLead(async () => {
      const r = await updateAcademicSectionTeacherAction({ locale, sectionId, teacherId });
      setMsgLead(r.ok ? dict.leadSaved : dict.leadError);
      if (r.ok) {
        router.refresh();
        setOpenModal(null);
      }
    });
  };

  const saveAssistants = () => {
    setMsgAsst(null);
    startAsst(async () => {
      const r = await replaceAcademicSectionAssistantsAction({ locale, sectionId, assistantIds });
      if (!r.ok) {
        setMsgAsst(r.code === "SCHEDULE_OVERLAP" ? dict.assistantsScheduleOverlap : dict.assistantsError);
        return;
      }
      setMsgAsst(dict.assistantsSaved);
      router.refresh();
    });
  };

  const saveExternal = () => {
    setMsgExt(null);
    startExt(async () => {
      const r = await replaceAcademicSectionExternalAssistantsAction({
        locale,
        sectionId,
        displayNames: externalNames,
      });
      setMsgExt(r.ok ? dict.externalSaved : dict.externalError);
      if (r.ok) {
        router.refresh();
        setOpenModal(null);
      }
    });
  };

  const body = (
    <>
      {!embedded ? (
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      ) : null}
      <div className={embedded ? "flex flex-wrap gap-2" : "mt-3 flex flex-wrap gap-2"}>
        <Button type="button" variant="secondary" onClick={() => setOpenModal("lead")}>
          <UserCog className="h-4 w-4 shrink-0" aria-hidden />
          {dict.leadOpenButton}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpenModal("assistants")}>
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          {dict.assistantsOpenButton}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpenModal("external")}>
          <UserRoundPlus className="h-4 w-4 shrink-0" aria-hidden />
          {dict.externalOpenButton}
        </Button>
      </div>

      <AcademicSectionStaffEditorModals
        openModal={openModal}
        onClose={closeModal}
        sectionId={sectionId}
        teachers={teachers}
        assistantPortalStaffOptions={assistantPortalStaffOptions}
        initialAssistants={initialAssistants}
        teacherId={teacherId}
        onTeacherChange={setTeacherId}
        pendingLead={pendingLead}
        dirtyLead={dirtyLead}
        onSaveLead={saveLead}
        msgLead={msgLead}
        assistantIds={assistantIds}
        assistantExtras={assistantExtras}
        onAssistantIdsChange={setAssistantIds}
        onAssistantExtrasChange={setAssistantExtras}
        pendingAsst={pendingAsst}
        dirtyAsst={dirtyAsst}
        onSaveAssistants={saveAssistants}
        msgAsst={msgAsst}
        externalNames={externalNames}
        newExternalName={newExternalName}
        onNewExternalNameChange={setNewExternalName}
        onRemoveExternalName={(name) => setExternalNames((prev) => prev.filter((x) => x !== name))}
        onAddExternal={() => {
          const n = newExternalName.trim().slice(0, 200);
          if (!n || externalNames.includes(n)) return;
          setExternalNames((prev) => [...prev, n]);
          setNewExternalName("");
        }}
        pendingExt={pendingExt}
        dirtyExt={dirtyExt}
        onSaveExternal={saveExternal}
        msgExt={msgExt}
        dict={dict}
      />
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {body}
    </section>
  );
}
