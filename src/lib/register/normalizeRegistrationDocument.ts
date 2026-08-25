import { normalizeDni } from "@/lib/import/studentImportUtils";

/** Same document key as import / accept (`normalizeDni().dni`). Comparison lowercases later. */
export function normalizeRegistrationDocument(raw: string): string {
  return normalizeDni(raw).dni;
}
