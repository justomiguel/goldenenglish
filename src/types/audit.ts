import type { AuditDomain, AuditJsonObject } from "@/lib/audit/types";

export type AuditSortKey = "created_at" | "actor" | "domain" | "action" | "resource";
export type AuditSortDir = "asc" | "desc";

export interface AdminAuditRow {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string | null;
  domain: AuditDomain;
  action: string;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  beforeValues: AuditJsonObject;
  afterValues: AuditJsonObject;
  diff: AuditJsonObject;
  metadata: AuditJsonObject;
  correlationId: string | null;
  createdAt: string;
}
