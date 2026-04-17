"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  replaceAcademicSectionAssistantsAction,
  updateAcademicSectionTeacherAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionStaffActions";
import { replaceAcademicSectionExternalAssistantsAction } from "@/app/[locale]/dashboard/admin/academic/sectionExternalAssistantsActions";
import { AcademicSectionStaffEditorLeadBlock } from "@/components/organisms/AcademicSectionStaffEditorLeadBlock";
import { AcademicSectionStaffEditorAssistantsBlock } from "@/components/organisms/AcademicSectionStaffEditorAssistantsBlock";
import { AcademicSectionStaffEditorExternalBlock } from "@/components/organisms/AcademicSectionStaffEditorExternalBlock";
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
}: AcademicSectionStaffEditorProps) {
  const router = useRouter();
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
    sortedAsst.length !== sortedInitial.length ||
    sortedAsst.some((id, i) => id !== sortedInitial[i]);

  const sortedExt = [...externalNames].map((s) => s.trim()).sort();
  const sortedInitialExt = [...initialExternalAssistants.map((e) => e.label.trim())].sort();
  const dirtyExt =
    sortedExt.length !== sortedInitialExt.length ||
    sortedExt.some((n, i) => n !== sortedInitialExt[i]);

  const saveLead = () => {
    setMsgLead(null);
    startLead(async () => {
      const r = await updateAcademicSectionTeacherAction({ locale, sectionId, teacherId });
      setMsgLead(r.ok ? dict.leadSaved : dict.leadError);
      if (r.ok) router.refresh();
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
      if (r.ok) router.refresh();
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>

      <AcademicSectionStaffEditorLeadBlock
        sectionId={sectionId}
        teachers={teachers}
        teacherId={teacherId}
        onTeacherChange={setTeacherId}
        pendingLead={pendingLead}
        dirtyLead={dirtyLead}
        onSaveLead={saveLead}
        msgLead={msgLead}
        dict={dict}
      />

      <AcademicSectionStaffEditorAssistantsBlock
        sectionId={sectionId}
        teachers={teachers}
        assistantPortalStaffOptions={assistantPortalStaffOptions}
        initialAssistants={initialAssistants}
        assistantIds={assistantIds}
        assistantExtras={assistantExtras}
        onAssistantIdsChange={setAssistantIds}
        onAssistantExtrasChange={setAssistantExtras}
        teacherId={teacherId}
        pendingAsst={pendingAsst}
        dirtyAsst={dirtyAsst}
        onSaveAssistants={saveAssistants}
        msgAsst={msgAsst}
        dict={dict}
      />

      <AcademicSectionStaffEditorExternalBlock
        sectionId={sectionId}
        externalNames={externalNames}
        newExternalName={newExternalName}
        onNewExternalNameChange={setNewExternalName}
        onRemoveName={(name) => setExternalNames((prev) => prev.filter((x) => x !== name))}
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
    </section>
  );
}
