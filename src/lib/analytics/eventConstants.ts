/**
 * Typed entity keys for user_events.entity — keep stable for SQL aggregates and exports.
 * Display labels may come from dictionaries; keys stay ASCII.
 */
export const AnalyticsEntity = {
  sessionStart: "session:start",
  pageViewPrefix: "route:",
  payments: "section:payments",
  messages: "section:messages",
  studentHome: "section:student_home",
  teacherMessages: "section:teacher_messages",
  adminSettings: "section:admin_settings",
  myProfile: "section:my_profile",
  teacherMessageReply: "teacher_message_reply",
  teacherMessageSent: "teacher_message_sent",
  parentMessageSent: "parent_message_sent",
  /** Funnel: receipt uploaded from parent portal (legacy entity, kept for analytics history) */
  paymentReceiptSubmittedParent: "payment_receipt_submitted_parent",
  /** Funnel: receipt uploaded from student portal */
  paymentReceiptSubmittedStudent: "payment_receipt_submitted_student",
  /** Funnel: tutor uploaded a receipt on behalf of a linked student */
  paymentReceiptSubmittedTutor: "payment_receipt_submitted_tutor",
  /** Privacy: adult student revoked financial access for a linked tutor */
  tutorFinancialAccessRevokedByStudent: "tutor_financial_access_revoked_by_student",
  /** Privacy: adult student restored financial access for a linked tutor */
  tutorFinancialAccessRestoredByStudent: "tutor_financial_access_restored_by_student",
  billing: "section:billing",
  /** Structured invoice: receipt submitted (parent or adult student) */
  billingInvoiceReceiptSubmitted: "billing_invoice_receipt_submitted",
  /** Funnel: promotion code applied (actor = whoever invoked the action) */
  promotionCodeAppliedStudent: "promotion_code_applied_student",
  /** Teacher attendance matrix (bulk column fill, etc.) */
  teacherSectionAttendance: "section:teacher_section_attendance",
  /** Portal calendar + iCal subscription */
  portalCalendar: "section:portal_calendar",
  /** Learning tasks library, detail, and completion funnel */
  learningTasks: "section:learning_tasks",
  /** Student gamification: badges / achievements */
  studentBadges: "section:student_badges",
  /** Auth: user completed a password reset (recovery link → updateUser) */
  passwordResetCompleted: "auth:password_reset_completed",
  /** Funnel: enrollment fee receipt uploaded by the student */
  enrollmentFeeReceiptSubmittedStudent: "enrollment_fee_receipt_submitted_student",
  /** Funnel: enrollment fee receipt uploaded by a parent/tutor on behalf of a student */
  enrollmentFeeReceiptSubmittedTutor: "enrollment_fee_receipt_submitted_tutor",
} as const;

export type UserEventTypeName = "page_view" | "click" | "action" | "session_start";

export function pathnameToEntity(pathname: string): string {
  if (pathname.includes("/dashboard/student/payments")) return AnalyticsEntity.payments;
  if (pathname.includes("/dashboard/parent/payments")) return AnalyticsEntity.payments;
  if (pathname.includes("/dashboard/student/billing")) return AnalyticsEntity.billing;
  if (pathname.includes("/dashboard/parent/billing")) return AnalyticsEntity.billing;
  if (pathname.includes("/dashboard/admin/finance")) return AnalyticsEntity.billing;
  if (pathname.includes("/dashboard/student/messages")) return AnalyticsEntity.messages;
  if (pathname.includes("/dashboard/parent/messages")) return AnalyticsEntity.messages;
  if (pathname.includes("/dashboard/teacher/messages")) return AnalyticsEntity.teacherMessages;
  if (pathname.includes("/dashboard/admin/settings")) return AnalyticsEntity.adminSettings;
  if (pathname.includes("/dashboard/profile")) return AnalyticsEntity.myProfile;
  if (pathname.match(/\/dashboard\/student\/?$/)) return AnalyticsEntity.studentHome;
  if (pathname.includes("/dashboard/student/calendar")) return AnalyticsEntity.portalCalendar;
  if (pathname.includes("/dashboard/parent/calendar")) return AnalyticsEntity.portalCalendar;
  if (pathname.includes("/dashboard/teacher/calendar")) return AnalyticsEntity.portalCalendar;
  if (pathname.includes("/dashboard/student/badges")) return AnalyticsEntity.studentBadges;
  if (pathname.includes("/dashboard/student/tasks")) return AnalyticsEntity.learningTasks;
  if (pathname.includes("/dashboard/teacher/tasks")) return AnalyticsEntity.learningTasks;
  if (pathname.includes("/dashboard/teacher/sections") && pathname.includes("/tasks")) {
    return AnalyticsEntity.learningTasks;
  }
  if (pathname.includes("/dashboard/admin/calendar/special")) return AnalyticsEntity.portalCalendar;
  if (pathname.includes("/dashboard/admin/calendar")) return AnalyticsEntity.portalCalendar;
  return `${AnalyticsEntity.pageViewPrefix}${pathname}`;
}
