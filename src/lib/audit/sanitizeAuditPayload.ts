import type { AuditJsonObject, AuditJsonValue } from "@/lib/audit/types";

const REDACTED = "[REDACTED]";
const SECRET_KEY_PATTERN =
  /(password|passcode|token|secret|service[_-]?role|api[_-]?key|authorization|cookie|session|signed[_-]?url)/i;

function isPlainObject(value: AuditJsonValue): value is AuditJsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeAuditPayload<T extends AuditJsonObject | undefined>(
  payload: T,
): T {
  if (!payload) return payload;
  return sanitizeObject(payload) as T;
}

function sanitizeObject(payload: AuditJsonObject): AuditJsonObject {
  const next: AuditJsonObject = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      next[key] = REDACTED;
      continue;
    }
    next[key] = sanitizeValue(value);
  }
  return next;
}

function sanitizeValue(value: AuditJsonValue): AuditJsonValue {
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (isPlainObject(value)) return sanitizeObject(value);
  return value;
}
