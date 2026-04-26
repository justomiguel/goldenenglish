import { SectionAttendanceMatrix } from "@/components/organisms/SectionAttendanceMatrix";
import type { TeacherAttendanceMatrixPayload } from "@/types/teacherAttendanceMatrix";
import type { Dictionary } from "@/types/i18n";

type TeacherAttendanceDict = Dictionary["dashboard"]["teacherSectionAttendance"];

export function AcademicSectionPageAttendancePanel({
  locale,
  sectionId,
  todayIso,
  attendanceScheduleLine,
  attendanceWindowOk,
  hasScheduleSlots,
  hasEligibleAttendanceDays,
  attendanceMatrix,
  editableByDate,
  dTeacherAttendance,
}: {
  locale: string;
  sectionId: string;
  todayIso: string;
  attendanceScheduleLine: string;
  attendanceWindowOk: boolean;
  hasScheduleSlots: boolean;
  hasEligibleAttendanceDays: boolean;
  attendanceMatrix: TeacherAttendanceMatrixPayload | null;
  editableByDate: Record<string, boolean>;
  dTeacherAttendance: TeacherAttendanceDict;
}) {
  return (
    <>
      {attendanceScheduleLine ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{attendanceScheduleLine}</p>
      ) : null}
      {!attendanceWindowOk ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {dTeacherAttendance.noEligibleClassDates}
        </p>
      ) : !hasScheduleSlots ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {dTeacherAttendance.noScheduleSlots}
        </p>
      ) : !hasEligibleAttendanceDays ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {dTeacherAttendance.noEligibleClassDates}
        </p>
      ) : attendanceMatrix ? (
        <SectionAttendanceMatrix
          variant="admin"
          locale={locale}
          sectionId={sectionId}
          todayIso={todayIso}
          initialPayloadJson={JSON.stringify(attendanceMatrix)}
          editableByDateJson={JSON.stringify(editableByDate)}
          scheduleLine={attendanceScheduleLine}
          matrixDict={dTeacherAttendance.matrix}
          offlineHint={dTeacherAttendance.offlineHint}
        />
      ) : null}
    </>
  );
}
