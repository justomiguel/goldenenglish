"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { SectionScheduleFields } from "@/components/molecules/SectionScheduleFields";
import { SectionPeriodFields } from "@/components/molecules/SectionPeriodFields";
import { NewSectionMaxStudentsFields } from "@/components/molecules/NewSectionMaxStudentsFields";
import { NewSectionTeacherAndNameFields } from "@/components/molecules/NewSectionTeacherAndNameFields";
import { createAcademicSectionAction } from "@/app/[locale]/dashboard/admin/academic/sectionActions";
import {
  createEmptySectionScheduleSlotDraft,
  sectionScheduleDraftsToSlots,
  type SectionScheduleSlotDraft,
} from "@/lib/academics/sectionScheduleDrafts";
import { defaultSectionPeriodInitial, parseCustomMaxStudents } from "@/lib/academics/newSectionModalHelpers";
import type { AcademicNewSectionModalProps } from "./AcademicNewSectionModal.types";

export type { AcademicNewSectionModalDict, AcademicNewSectionModalProps } from "./AcademicNewSectionModal.types";

export function AcademicNewSectionModal({
  locale,
  cohortId,
  open,
  onOpenChange,
  teachers,
  defaultMaxStudents,
  dict,
}: AcademicNewSectionModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startsOn, setStartsOn] = useState(() => defaultSectionPeriodInitial().startsOn);
  const [endsOn, setEndsOn] = useState(() => defaultSectionPeriodInitial().endsOn);
  const [customizeMax, setCustomizeMax] = useState(false);
  const [maxRaw, setMaxRaw] = useState("");
  const [scheduleRows, setScheduleRows] = useState<SectionScheduleSlotDraft[]>([
    createEmptySectionScheduleSlotDraft(),
  ]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [openSnapshot, setOpenSnapshot] = useState(open);

  if (open && !openSnapshot) {
    setOpenSnapshot(true);
    const d = defaultSectionPeriodInitial();
    setStartsOn(d.startsOn);
    setEndsOn(d.endsOn);
  } else if (!open && openSnapshot) {
    setOpenSnapshot(false);
  }

  const handleModalOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setTeacherId("");
      setCustomizeMax(false);
      setMaxRaw("");
      setScheduleRows([createEmptySectionScheduleSlotDraft()]);
      setErr(null);
    }
    onOpenChange(next);
  };

  const submit = () => {
    setErr(null);
    const maxParsed = parseCustomMaxStudents(customizeMax, maxRaw);
    if (!maxParsed.ok) {
      setErr(dict.maxStudentsInvalid);
      return;
    }
    const maxStudents = maxParsed.value;
    const scheduleSlots = sectionScheduleDraftsToSlots(scheduleRows);
    if (!scheduleSlots || scheduleSlots.length === 0) {
      setErr(dict.scheduleInvalid);
      return;
    }
    start(async () => {
      const r = await createAcademicSectionAction({
        locale,
        cohortId,
        name,
        teacherId,
        startsOn,
        endsOn,
        maxStudents,
        scheduleSlots,
      });
      if (!r.ok) {
        setErr(dict.error);
        return;
      }
      handleModalOpenChange(false);
      router.push(`/${locale}/dashboard/admin/academic/${cohortId}/${r.id}`);
      router.refresh();
    });
  };

  const periodDict = {
    startsLabel: dict.sectionPeriodStartsLabel,
    endsLabel: dict.sectionPeriodEndsLabel,
  };

  const basicsDict = {
    nameLabel: dict.nameLabel,
    teacherLabel: dict.teacherLabel,
    teacherPlaceholder: dict.teacherPlaceholder,
  };

  const maxDict = {
    maxStudentsLabel: dict.maxStudentsLabel,
    maxStudentsDefaultHint: dict.maxStudentsDefaultHint,
    maxStudentsCustomize: dict.maxStudentsCustomize,
    maxStudentsCustomLabel: dict.maxStudentsCustomLabel,
    maxStudentsCustomHint: dict.maxStudentsCustomHint,
  };

  const canSubmit =
    name.trim().length >= 2 &&
    teacherId.length > 0 &&
    teachers.length > 0 &&
    startsOn.length > 0 &&
    endsOn.length > 0;

  return (
    <Modal
      open={open}
      onOpenChange={handleModalOpenChange}
      titleId="new-section-title"
      title={dict.title}
      disableClose={pending}
    >
      <div className="space-y-3">
        {teachers.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{dict.noTeachers}</p>
        ) : null}

        <NewSectionTeacherAndNameFields
          name={name}
          onNameChange={setName}
          teacherId={teacherId}
          onTeacherIdChange={setTeacherId}
          teachers={teachers}
          dict={basicsDict}
          disabled={pending}
        />

        <SectionPeriodFields
          idPrefix="ns-period"
          startsOn={startsOn}
          endsOn={endsOn}
          onChange={({ startsOn: s, endsOn: e }) => {
            setStartsOn(s);
            setEndsOn(e);
          }}
          dict={periodDict}
          disabled={pending}
        />

        <NewSectionMaxStudentsFields
          defaultMaxStudents={defaultMaxStudents}
          customizeMax={customizeMax}
          onCustomizeMaxChange={(next) => {
            setCustomizeMax(next);
            if (next) setMaxRaw(String(defaultMaxStudents));
            else setMaxRaw("");
          }}
          maxRaw={maxRaw}
          onMaxRawChange={setMaxRaw}
          dict={maxDict}
          disabled={pending}
        />

        <div>
          <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.scheduleTitle}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{dict.scheduleHint}</p>
          <div className="mt-2">
            <SectionScheduleFields
              rows={scheduleRows}
              onChange={setScheduleRows}
              dict={dict}
              disabled={pending}
            />
          </div>
        </div>

        {err ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {err}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => handleModalOpenChange(false)}>
            {dict.cancel}
          </Button>
          <Button
            type="button"
            isLoading={pending}
            disabled={pending || !canSubmit}
            onClick={submit}
          >
            {dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
