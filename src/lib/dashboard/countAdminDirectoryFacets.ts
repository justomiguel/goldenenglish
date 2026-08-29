import type {
  AdminDirectoryCandidate,
  AdminDirectoryFilterKey,
  AdminDirectoryFilters,
} from "@/lib/dashboard/adminDirectoryFilters";
import { filterAdminDirectoryCandidates } from "@/lib/dashboard/matchAdminDirectoryCandidate";

export type DirectoryBinaryFacet = { all: number; with: number; without: number };

export type AdminDirectoryFacets = {
  section: Record<string, number>;
  sectionAll: number;
  access: { all: number; never: number; entered: number };
  phone: DirectoryBinaryFacet;
  created: { all: number; last30: number; older: number };
  enrollment: DirectoryBinaryFacet;
  teachingRole: { all: number; lead: number; assistant: number };
  parentLink: DirectoryBinaryFacet;
  scholarship: DirectoryBinaryFacet;
  due: DirectoryBinaryFacet;
  email: { all: number; deliverable: number; none: number };
  children: DirectoryBinaryFacet;
};

function withoutKey(
  filters: AdminDirectoryFilters,
  key: AdminDirectoryFilterKey,
): AdminDirectoryFilters {
  const next = { ...filters };
  delete next[key];
  return next;
}

function countWith(
  candidates: AdminDirectoryCandidate[],
  filters: AdminDirectoryFilters,
  now: Date,
): number {
  return filterAdminDirectoryCandidates(candidates, filters, { now }).length;
}

function binaryFacet(
  candidates: AdminDirectoryCandidate[],
  filters: AdminDirectoryFilters,
  key: Extract<AdminDirectoryFilterKey, "phone" | "enrollment" | "parentLink" | "scholarship" | "due" | "children">,
  now: Date,
): DirectoryBinaryFacet {
  const base = withoutKey(filters, key);
  return {
    all: countWith(candidates, base, now),
    with: countWith(candidates, { ...base, [key]: "with" }, now),
    without: countWith(candidates, { ...base, [key]: "without" }, now),
  };
}

export function countAdminDirectoryFacets(
  candidates: AdminDirectoryCandidate[],
  filters: AdminDirectoryFilters,
  sectionIds: string[],
  now: Date = new Date(),
): AdminDirectoryFacets {
  const sectionBase = withoutKey(filters, "section");
  const section: Record<string, number> = {};
  for (const id of sectionIds) {
    section[id] = countWith(candidates, { ...sectionBase, section: id }, now);
  }
  const accessBase = withoutKey(filters, "access");
  const createdBase = withoutKey(filters, "created");
  const teachingBase = withoutKey(filters, "teachingRole");
  const emailBase = withoutKey(filters, "email");
  return {
    section,
    sectionAll: countWith(candidates, sectionBase, now),
    access: {
      all: countWith(candidates, accessBase, now),
      never: countWith(candidates, { ...accessBase, access: "never" }, now),
      entered: countWith(candidates, { ...accessBase, access: "entered" }, now),
    },
    phone: binaryFacet(candidates, filters, "phone", now),
    created: {
      all: countWith(candidates, createdBase, now),
      last30: countWith(candidates, { ...createdBase, created: "last30" }, now),
      older: countWith(candidates, { ...createdBase, created: "older" }, now),
    },
    enrollment: binaryFacet(candidates, filters, "enrollment", now),
    teachingRole: {
      all: countWith(candidates, teachingBase, now),
      lead: countWith(candidates, { ...teachingBase, teachingRole: "lead" }, now),
      assistant: countWith(candidates, { ...teachingBase, teachingRole: "assistant" }, now),
    },
    parentLink: binaryFacet(candidates, filters, "parentLink", now),
    scholarship: binaryFacet(candidates, filters, "scholarship", now),
    due: binaryFacet(candidates, filters, "due", now),
    email: {
      all: countWith(candidates, emailBase, now),
      deliverable: countWith(candidates, { ...emailBase, email: "deliverable" }, now),
      none: countWith(candidates, { ...emailBase, email: "none" }, now),
    },
    children: binaryFacet(candidates, filters, "children", now),
  };
}

export function emptyAdminDirectoryFacets(): AdminDirectoryFacets {
  return countAdminDirectoryFacets([], {}, []);
}
