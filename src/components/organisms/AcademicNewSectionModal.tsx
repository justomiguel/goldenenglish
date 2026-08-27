"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { SectionScheduleFields } from "@/components/molecules/SectionScheduleFields";
import { SectionPeriodFields } from "@/components/molecules/SectionPeriodFields";
import { NewSectionMaxStudentsFields } from "@/components/molecules/NewSectionMaxStudentsFields";
import { NewSectionTeacherAndNameFields } from "@/components/molecules/NewSectionTeacherAndNameFields";
import { NewSectionPhotoFields } from "@/components/molecules/NewSectionPhotoFields";
import { submitNewAcademicSection } from "@/lib/academics/submitNewAcademicSection";
import { isAllowedSectionImageUpload } from "@/lib/register/sectionReferenceImage";
import { useAdminTourSessionActive } from "@/lib/admin-tutorials/client/adminTourSession";
import { sectionScheduleDraftsToSlots } from "@/lib/academics/sectionScheduleDrafts";
import {
  defaultSectionPeriodInitial,
  emptyNewSectionFormState,
  parseCustomMaxStudents,
} from "@/lib/academics/newSectionModalHelpers";
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
  const tourActive = useAdminTourSessionActive();
  const [retainStackedAfterTour, setRetainStackedAfterTour] = useState(false);
  const empty = emptyNewSectionFormState();
  const [name, setName] = useState(empty.name);
  const [teacherId, setTeacherId] = useState(empty.teacherId);
  const [startsOn, setStartsOn] = useState(() => defaultSectionPeriodInitial().startsOn);
  const [endsOn, setEndsOn] = useState(() => defaultSectionPeriodInitial().endsOn);
  const [customizeMax, setCustomizeMax] = useState(empty.customizeMax);
  const [maxRaw, setMaxRaw] = useState(empty.maxRaw);
  const [scheduleRows, setScheduleRows] = useState(empty.scheduleRows);
  const [photo, setPhoto] = useState<File | null>(empty.photo);
  const [photoInvalid, setPhotoInvalid] = useState(empty.photoInvalid);
  const [photoPhase, setPhotoPhase] = useState<"idle" | "reading" | "sending">("idle");
  const [photoPct, setPhotoPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [openSnapshot, setOpenSnapshot] = useState(open);

  if (open && tourActive && !retainStackedAfterTour) {
    setRetainStackedAfterTour(true);
  } else if (!open && retainStackedAfterTour) {
    setRetainStackedAfterTour(false);
  }

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
      const reset = emptyNewSectionFormState();
      setName(reset.name);
      setTeacherId(reset.teacherId);
      setCustomizeMax(reset.customizeMax);
      setMaxRaw(reset.maxRaw);
      setScheduleRows(reset.scheduleRows);
      setPhoto(reset.photo);
      setPhotoInvalid(reset.photoInvalid);
      setPhotoPhase("idle");
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
    if (photo && !isAllowedSectionImageUpload(photo.type, photo.size)) {
      setErr(dict.photoInvalid);
      return;
    }
    start(async () => {
      const r = await submitNewAcademicSection({
        locale,
        cohortId,
        name,
        teacherId,
        startsOn,
        endsOn,
        maxStudents,
        scheduleSlots,
        photo,
        onReadProgress: setPhotoPct,
        onPhase: setPhotoPhase,
      });
      if (!r.ok) {
        setErr(dict.error);
        return;
      }
      if (photo && !r.imageSaved) {
        setErr(dict.photoSaveFailed);
      }
      handleModalOpenChange(false);
      window.location.assign(`/${locale}/dashboard/admin/academic/${cohortId}/${r.id}`);
    });
  };

  const canSubmit =
    name.trim().length >= 2 && teacherId.length > 0 && teachers.length > 0 && startsOn && endsOn;

  return (
    <Modal
      open={open}
      onOpenChange={handleModalOpenChange}
      titleId="new-section-title"
      title={dict.title}
      disableClose={pending}
      stackBelowTour={tourActive || retainStackedAfterTour}
    >
      <div className="space-y-3">
        {teachers.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{dict.noTeachers}</p>
        ) : null}

        <div data-tour="academic-new-section-basics">
          <NewSectionTeacherAndNameFields
            name={name}
            onNameChange={setName}
            teacherId={teacherId}
            onTeacherIdChange={setTeacherId}
            teachers={teachers}
            dict={dict}
            disabled={pending}
          />
          <NewSectionPhotoFields
            file={photo}
            invalid={photoInvalid}
            disabled={pending}
            phase={photoPhase}
            pct={photoPct}
            dict={dict}
            onFileChange={(next, bad) => {
              setPhoto(next);
              setPhotoInvalid(bad);
            }}
          />
        </div>

        <div data-tour="academic-new-section-period">
          <SectionPeriodFields
          idPrefix="ns-period"
          startsOn={startsOn}
          endsOn={endsOn}
          onChange={({ startsOn: s, endsOn: e }) => {
            setStartsOn(s);
            setEndsOn(e);
          }}
          dict={{
            startsLabel: dict.sectionPeriodStartsLabel,
            endsLabel: dict.sectionPeriodEndsLabel,
          }}
          disabled={pending}
        />
        </div>

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
          dict={dict}
          disabled={pending}
        />

        <div data-tour="academic-new-section-schedule">
          <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.scheduleTitle}</p>
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
            {!pending ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.cancel}
          </Button>
          <Button
            type="button"
            isLoading={pending}
            disabled={pending || !canSubmit}
            data-tour="academic-new-section-submit"
            onClick={submit}
          >
            {!pending ? <Plus className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
