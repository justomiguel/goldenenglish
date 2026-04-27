export type AuditDomain =
  | "academic"
  | "sections"
  | "finance"
  | "identity"
  | "communications"
  | "system";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "approve"
  | "reject"
  | "assign"
  | "unassign"
  | "publish"
  | "archive"
  | "submit"
  | "review"
  | (string & {});

export type AuditJsonValue =
  | null
  | string
  | number
  | boolean
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };

export type AuditJsonObject = Record<string, AuditJsonValue>;

export interface AuditDiffEntry {
  before: AuditJsonValue;
  after: AuditJsonValue;
}

export type AuditDiff = Record<string, AuditDiffEntry>;

export interface RecordAuditEventInput {
  actorId: string;
  actorRole?: string | null;
  domain: AuditDomain;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  summary: string;
  beforeValues?: AuditJsonObject;
  afterValues?: AuditJsonObject;
  diff?: AuditDiff;
  metadata?: AuditJsonObject;
  correlationId?: string | null;
}
