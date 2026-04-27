import { recordAuditEvent } from "@/lib/audit/recordAuditEvent";
import type { AuditDomain, RecordAuditEventInput } from "@/lib/audit/types";

type DomainAuditInput = Omit<RecordAuditEventInput, "domain">;

function auditDomain(domain: AuditDomain, input: DomainAuditInput) {
  return recordAuditEvent({ ...input, domain });
}

export function auditAcademicAction(input: DomainAuditInput) {
  return auditDomain("academic", input);
}

export function auditSectionAction(input: DomainAuditInput) {
  return auditDomain("sections", input);
}

export function auditFinanceAction(input: DomainAuditInput) {
  return auditDomain("finance", input);
}

export function auditIdentityAction(input: DomainAuditInput) {
  return auditDomain("identity", input);
}

export function auditCommunicationsAction(input: DomainAuditInput) {
  return auditDomain("communications", input);
}
