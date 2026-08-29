import type { AdminDirectoryCandidate } from "@/lib/dashboard/adminDirectoryFilters";

export type DirectoryFactSection = { id: string; discountPercent?: number | null };
export type DirectoryFactPerson = { id: string };
export type DirectoryFactDue = { amount: number };

export type BuildAdminDirectoryCandidatesInput = {
  profiles: Array<{
    id: string;
    phone: string | null;
    created_at: string | null;
    last_session_start_at: string | null;
  }>;
  sectionsByPerson?: Map<string, DirectoryFactSection[]>;
  leadIdsByTeacher?: Map<string, string[]>;
  assistantIdsByTeacher?: Map<string, string[]>;
  parentsByStudent?: Map<string, DirectoryFactPerson[]>;
  monthlyDueByStudent?: Map<string, DirectoryFactDue[]>;
  childrenByParent?: Map<string, DirectoryFactPerson[]>;
  emailDeliverableById?: Map<string, boolean>;
};

export function buildAdminDirectoryCandidates(
  input: BuildAdminDirectoryCandidatesInput,
): AdminDirectoryCandidate[] {
  return input.profiles.map((profile) => {
    const sections = input.sectionsByPerson?.get(profile.id) ?? [];
    const dues = input.monthlyDueByStudent?.get(profile.id) ?? [];
    return {
      id: profile.id,
      phone: profile.phone?.trim() ?? "",
      createdAt: profile.created_at,
      lastSessionStartAt: profile.last_session_start_at,
      sectionIds: sections.map((section) => section.id),
      leadSectionIds: input.leadIdsByTeacher?.get(profile.id) ?? [],
      assistantSectionIds: input.assistantIdsByTeacher?.get(profile.id) ?? [],
      hasParentLink: (input.parentsByStudent?.get(profile.id) ?? []).length > 0,
      hasScholarship: sections.some((section) => (section.discountPercent ?? 0) > 0),
      hasDue: dues.some((due) => due.amount > 0),
      emailDeliverable: input.emailDeliverableById?.get(profile.id) ?? false,
      hasChildren: (input.childrenByParent?.get(profile.id) ?? []).length > 0,
    };
  });
}
