"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import {
  fillEmptyTeacherAttendanceColumnAction,
  undoTeacherAttendanceColumnFillAction,
} from "@/app/[locale]/dashboard/teacher/sections/teacherAttendanceMatrixActions";
import {
  fillEmptyAdminAttendanceColumnAction,
  undoAdminAttendanceColumnFillAction,
} from "@/app/[locale]/dashboard/admin/academic/adminSectionAttendanceActions";
import type { Dictionary } from "@/types/i18n";
import type { TeacherAttendanceMatrixCells } from "@/types/teacherAttendanceMatrix";
import type { AttendanceMatrixAutosaveVariant } from "@/hooks/useAttendanceMatrixAutosave";

type MatrixDict = Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];

export function useSectionAttendanceMatrixBulk(
  variant: AttendanceMatrixAutosaveVariant,
  locale: string,
  sectionId: string,
  router: { refresh: () => void | Promise<void> },
  matrixDict: MatrixDict,
  setCells: Dispatch<SetStateAction<TeacherAttendanceMatrixCells>>,
  setToast: (t: string | null) => void,
  setColumnBusyDate: (d: string | null) => void,
  setUndoOffer: (o: { dateIso: string; ids: string[] } | null) => void,
) {
  const handleColumnFill = useCallback(
    async (attendedOn: string) => {
      setToast(null);
      setColumnBusyDate(attendedOn);
      const fd = new FormData();
      fd.set("payload", JSON.stringify({ locale, sectionId, attendedOn }));
      const res =
        variant === "teacher"
          ? await fillEmptyTeacherAttendanceColumnAction(null, fd)
          : await fillEmptyAdminAttendanceColumnAction(null, fd);
      setColumnBusyDate(null);
      if (res.ok && res.insertedEnrollmentIds?.length) {
        setCells((prev) => {
          const next = structuredClone(prev);
          for (const id of res.insertedEnrollmentIds!) {
            if (next[id]?.[attendedOn] === null) next[id]![attendedOn] = "present";
          }
          return next;
        });
        setUndoOffer({ dateIso: attendedOn, ids: res.insertedEnrollmentIds });
        router.refresh();
        return;
      }
      if (!res.ok && res.code === "nothing_to_fill") {
        setToast(matrixDict.bulkNothingToFill);
        return;
      }
      if (!res.ok) {
        setToast(matrixDict.bulkError);
      }
    },
    [locale, matrixDict.bulkError, matrixDict.bulkNothingToFill, router, sectionId, setCells, setColumnBusyDate, setToast, setUndoOffer, variant],
  );

  const handleUndo = useCallback(
    async (undoOffer: { dateIso: string; ids: string[] }) => {
      setToast(null);
      const fd = new FormData();
      fd.set(
        "payload",
        JSON.stringify({
          locale,
          sectionId,
          attendedOn: undoOffer.dateIso,
          enrollmentIds: undoOffer.ids,
        }),
      );
      const res =
        variant === "teacher"
          ? await undoTeacherAttendanceColumnFillAction(null, fd)
          : await undoAdminAttendanceColumnFillAction(null, fd);
      setUndoOffer(null);
      if (!res.ok) {
        setToast(matrixDict.undoError);
        return;
      }
      router.refresh();
    },
    [locale, matrixDict.undoError, router, sectionId, setToast, setUndoOffer, variant],
  );

  return { handleColumnFill, handleUndo };
}
