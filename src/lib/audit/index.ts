export { buildAuditDiff } from "@/lib/audit/buildAuditDiff";
export {
  auditAcademicAction,
  auditCommunicationsAction,
  auditFinanceAction,
  auditIdentityAction,
  auditSectionAction,
} from "@/lib/audit/domainAudit";
export { recordAuditEvent } from "@/lib/audit/recordAuditEvent";
export { sanitizeAuditPayload } from "@/lib/audit/sanitizeAuditPayload";
export type {
  AuditAction,
  AuditDiff,
  AuditDomain,
  AuditJsonObject,
  AuditJsonValue,
  RecordAuditEventInput,
} from "@/lib/audit/types";
