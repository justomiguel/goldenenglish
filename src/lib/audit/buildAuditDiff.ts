import type { AuditDiff, AuditJsonObject, AuditJsonValue } from "@/lib/audit/types";

function stableStringify(value: AuditJsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

export function buildAuditDiff(
  beforeValues: AuditJsonObject = {},
  afterValues: AuditJsonObject = {},
): AuditDiff {
  const keys = new Set([...Object.keys(beforeValues), ...Object.keys(afterValues)]);
  const diff: AuditDiff = {};

  for (const key of keys) {
    const before = beforeValues[key] ?? null;
    const after = afterValues[key] ?? null;
    if (stableStringify(before) !== stableStringify(after)) {
      diff[key] = { before, after };
    }
  }

  return diff;
}
