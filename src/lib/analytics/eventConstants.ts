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
  /** Funnel: receipt uploaded from parent portal */
  paymentReceiptSubmittedParent: "payment_receipt_submitted_parent",
  /** Funnel: receipt uploaded from student portal */
  paymentReceiptSubmittedStudent: "payment_receipt_submitted_student",
  billing: "section:billing",
  /** Structured invoice: receipt submitted (parent or adult student) */
  billingInvoiceReceiptSubmitted: "billing_invoice_receipt_submitted",
  /** Funnel: promotion code applied (actor = whoever invoked the action) */
  promotionCodeAppliedStudent: "promotion_code_applied_student",
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
  return `${AnalyticsEntity.pageViewPrefix}${pathname}`;
}
