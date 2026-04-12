/**
 * Typed entity keys for user_events.entity — keep stable for SQL aggregates and exports.
 * Display labels may come from dictionaries; keys stay ASCII.
 */
export const ANALYTICS_EVENT_NAMESPACE = "goldenenglish";

export const AnalyticsEntity = {
  sessionStart: "session:start",
  pageViewPrefix: "route:",
  sectionPrefix: "section:",
  payments: "section:payments",
  messages: "section:messages",
  studentHome: "section:student_home",
  teacherMessages: "section:teacher_messages",
  adminSettings: "section:admin_settings",
  materialPrefix: "material:",
  teacherMessageReply: "teacher_message_reply",
  teacherMessageSent: "teacher_message_sent",
  siteSettingsUpdate: "site_settings_update",
  /** Funnel: comprobante cargado desde portal padre */
  paymentReceiptSubmittedParent: "payment_receipt_submitted_parent",
  /** Funnel: comprobante cargado desde portal alumno */
  paymentReceiptSubmittedStudent: "payment_receipt_submitted_student",
  /** Funnel: código de promoción aplicado (actor = quien invoca la acción) */
  promotionCodeAppliedStudent: "promotion_code_applied_student",
} as const;

export type UserEventTypeName = "page_view" | "click" | "action" | "session_start";

export function pathnameToEntity(pathname: string): string {
  if (pathname.includes("/dashboard/student/payments")) return AnalyticsEntity.payments;
  if (pathname.includes("/dashboard/parent/payments")) return AnalyticsEntity.payments;
  if (pathname.includes("/dashboard/student/messages")) return AnalyticsEntity.messages;
  if (pathname.includes("/dashboard/teacher/messages")) return AnalyticsEntity.teacherMessages;
  if (pathname.includes("/dashboard/admin/settings")) return AnalyticsEntity.adminSettings;
  if (pathname.match(/\/dashboard\/student\/?$/)) return AnalyticsEntity.studentHome;
  return `${AnalyticsEntity.pageViewPrefix}${pathname}`;
}
