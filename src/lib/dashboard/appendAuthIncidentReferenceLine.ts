import type { Dictionary } from "@/types/i18n";
import { fillTemplate } from "@/lib/i18n/fillTemplate";

/** Appends a stable incident id so staff can match user reports to `[ge:server]` logs. */
export function appendAuthIncidentReferenceLine(
  dict: Dictionary,
  baseMessage: string,
  supportRef?: string,
): string {
  const trimmed = supportRef?.trim();
  if (!trimmed) return baseMessage;
  return `${baseMessage}\n\n${fillTemplate(dict.admin.users.errAuthCreateIncidentRefLine, {
    supportRef: trimmed,
  })}`;
}
