import "server-only";
import { randomUUID } from "node:crypto";

/** Correlation id for `[ge:server]` logs and surfaced user-facing support copy (no PII). */
export function createIncidentSupportRef(): string {
  return randomUUID();
}
