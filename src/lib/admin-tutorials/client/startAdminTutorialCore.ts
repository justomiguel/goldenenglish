import { startCreateCohortTour } from "@/lib/admin-tutorials/client/startCreateCohortTour";
import { startCreateSectionTour } from "@/lib/admin-tutorials/client/startCreateSectionTour";
import { startCreateStudentTour } from "@/lib/admin-tutorials/client/startCreateStudentTour";
import {
  startCreateAdminTour,
  startCreateTeacherTour,
} from "@/lib/admin-tutorials/client/startCreateStaffUserTour";
import { startCreateEventTour } from "@/lib/admin-tutorials/client/startCreateEventTour";
import {
  startApprovePaymentTour,
  startRejectPaymentTour,
} from "@/lib/admin-tutorials/client/startPaymentReviewTour";
import { startTakeAttendanceTour } from "@/lib/admin-tutorials/client/startTakeAttendanceTour";
import {
  startAssignScholarshipFullTour,
  startAssignScholarshipPercentTour,
} from "@/lib/admin-tutorials/client/startAssignScholarshipTour";
import {
  toAssignScholarshipCopy,
  toCreateCohortCopy,
  toCreateEventCopy,
  toCreateSectionCopy,
  toCreateStaffCopy,
  toCreateStudentCopy,
  toPaymentReviewCopy,
  toTakeAttendanceCopy,
} from "@/lib/admin-tutorials/client/mapAdminTutorialCopy";
import type { StartAdminTutorialInput } from "@/lib/admin-tutorials/client/startAdminTutorialTypes";

/** Core catalog tutorials (cohort → scholarships). Returns true when handled. */
export async function startAdminTutorialCore(
  input: StartAdminTutorialInput,
): Promise<boolean> {
  switch (input.id) {
    case "create-cohort":
      await startCreateCohortTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateCohortCopy(input.toursDict.createCohort),
        push: input.push,
        startCreateSectionTour: () =>
          startCreateSectionTour({
            locale: input.locale,
            pathname: input.pathname,
            copy: toCreateSectionCopy(input.toursDict.createSection),
            push: input.push,
          }),
      });
      return true;
    case "create-section":
      await startCreateSectionTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateSectionCopy(input.toursDict.createSection),
        push: input.push,
      });
      return true;
    case "create-student":
      await startCreateStudentTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateStudentCopy(input.toursDict.createStudent),
        push: input.push,
      });
      return true;
    case "create-teacher":
      await startCreateTeacherTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateStaffCopy(input.toursDict.createTeacher),
        push: input.push,
      });
      return true;
    case "create-admin":
      await startCreateAdminTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateStaffCopy(input.toursDict.createAdmin),
        push: input.push,
      });
      return true;
    case "create-event":
      await startCreateEventTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateEventCopy(input.toursDict.createEvent),
        push: input.push,
      });
      return true;
    case "approve-payment":
      await startApprovePaymentTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toPaymentReviewCopy(input.toursDict.approvePayment),
        push: input.push,
      });
      return true;
    case "reject-payment":
      await startRejectPaymentTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toPaymentReviewCopy(input.toursDict.rejectPayment),
        push: input.push,
      });
      return true;
    case "take-attendance":
      await startTakeAttendanceTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toTakeAttendanceCopy(input.toursDict.takeAttendance),
        push: input.push,
      });
      return true;
    case "assign-scholarship-percent":
      await startAssignScholarshipPercentTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toAssignScholarshipCopy(input.toursDict.assignScholarshipPercent),
        push: input.push,
      });
      return true;
    case "assign-scholarship-full":
      await startAssignScholarshipFullTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toAssignScholarshipCopy(input.toursDict.assignScholarshipFull),
        push: input.push,
      });
      return true;
    default:
      return false;
  }
}
