"use server";

/** Server-only barrel. Client components must import from `*Actions.ts` / `upsertStudentScholarship.ts` (Next server-action boundary). */
export {
  createStudentScholarship,
  deactivateStudentScholarship,
  updateStudentScholarship,
} from "./upsertStudentScholarship";
export { setPeriodExemption } from "./periodExemptionActions";
export { applyExemptionRange } from "./applyExemptionRangeAction";
export {
  setEnrollmentFeeExemption,
  markEnrollmentFeePaidNow,
} from "./enrollmentFeeActions";
