import type { ParentAccessFilter } from "@/lib/parents/parentRecipient";
import {
  parseAdminDirectoryFilters,
  type DirectoryBinaryFilter,
  type DirectoryCreatedFilter,
  type DirectoryEmailFilter,
} from "@/lib/dashboard/adminDirectoryFilters";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ParentRecipientScope =
  | { kind: "ids"; ids: string[] }
  | {
      kind: "filter";
      q: string;
      section: string | null;
      access: ParentAccessFilter;
      phone?: DirectoryBinaryFilter;
      created?: DirectoryCreatedFilter;
      email?: DirectoryEmailFilter;
      children?: DirectoryBinaryFilter;
    };

function asString(raw: string | string[] | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function parseAccess(raw: string): ParentAccessFilter {
  if (raw === "never" || raw === "entered") return raw;
  return "all";
}

export function parseParentRecipientScope(
  raw: Record<string, string | string[] | undefined>,
): ParentRecipientScope {
  const idsRaw = asString(raw.ids);
  if (idsRaw) {
    const ids = idsRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => UUID_RE.test(s));
    return { kind: "ids", ids };
  }
  if (asString(raw.scope) === "filter") {
    const filters = parseAdminDirectoryFilters("parent", raw);
    const section = asString(raw.section).trim();
    return {
      kind: "filter",
      q: asString(raw.q).trim(),
      section: UUID_RE.test(section) ? section : null,
      access: parseAccess(asString(raw.access)),
      ...(filters.phone ? { phone: filters.phone } : {}),
      ...(filters.created ? { created: filters.created } : {}),
      ...(filters.email ? { email: filters.email } : {}),
      ...(filters.children ? { children: filters.children } : {}),
    };
  }
  return { kind: "ids", ids: [] };
}
