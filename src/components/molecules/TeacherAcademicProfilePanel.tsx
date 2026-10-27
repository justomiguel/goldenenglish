"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { AdminAcademicProfileFields } from "@/components/molecules/AdminAcademicProfileFields";
import { loadAcademicProfileCardAction } from "@/app/[locale]/dashboard/admin/users/academicProfileCardActions";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["users"]["academicFields"];

export function TeacherAcademicProfilePanel({
  open,
  locale,
  sectionId,
  studentId,
  studentLabel,
  labels,
  onOpenChange,
}: {
  open: boolean;
  locale: string;
  sectionId: string;
  studentId: string | null;
  studentLabel: string;
  labels: Labels;
  onOpenChange: (open: boolean) => void;
}) {
  const [fields, setFields] = useState<AcademicProfileCardField[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !studentId) return;
    let cancelled = false;
    void loadAcademicProfileCardAction({ studentId, sectionId }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error === "forbidden" ? labels.forbidden : labels.saveError);
        setFields([]);
        return;
      }
      setError(null);
      setFields(result.fields);
    });
    return () => {
      cancelled = true;
    };
  }, [open, studentId, sectionId, labels.forbidden, labels.saveError]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="teacher-academic-profile-title"
      title={studentLabel}
      closeLabel={labels.cancel}
    >
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {studentId ? (
        <AdminAcademicProfileFields
          locale={locale}
          studentId={studentId}
          sectionId={sectionId}
          editable
          canDefine={false}
          fields={fields}
          labels={labels}
        />
      ) : null}
    </Modal>
  );
}
