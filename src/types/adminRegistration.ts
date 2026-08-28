import type { RegistrationIntakeState } from "@/lib/register/registrationIntake";

export interface AdminRegistrationRow {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  level_interest: string | null;
  status: string;
  created_at: string | null;
  tutor_name: string | null;
  tutor_dni: string | null;
  tutor_email: string | null;
  tutor_phone: string | null;
  tutor_relationship: string | null;
  preferred_section_id: string | null;
  additionalSectionIds: string[];
  existingStudentId: string | null;
  /** Follow-up stamp; null while the lead is still new. */
  contacted_at: string | null;
  contacted_by: string | null;
  sourceSectionLinkId: string | null;
  tenantExtras?: unknown;
  intakeState?: RegistrationIntakeState;
  snapshotTotal?: number;
  snapshotCurrency?: string;
  feeCaptured?: boolean;
  enrollmentFeeReceiptPath?: string | null;
  /** Live: a requested section no longer has an open seat. */
  requestedSectionFull?: boolean;
}
