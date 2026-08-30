import { EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS, type AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";
import type { AdminDirectoryRole } from "@/lib/dashboard/adminDirectoryFilters";
import {
  directoryBillingRowFields,
  type DirectoryStudentBillingFlags,
} from "@/lib/dashboard/directoryBillingStatus";

export type AdminDirectorySortRowProfile = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  last_session_start_at: string | null;
};

export type AdminDirectorySortRowExtras = {
  sectionsByPerson: Map<string, AdminUserRow["sections"]>;
  parentsByStudent: Map<string, AdminUserRow["parents"]>;
  childrenByParent: Map<string, AdminUserRow["children"]>;
  monthlyDueByStudent: Map<string, AdminUserRow["monthlyDue"]>;
  billingFlagsByPerson: Map<string, DirectoryStudentBillingFlags>;
  emailById: Map<string, string>;
  deliverable: Map<string, boolean>;
};

export function profileToAdminDirectorySortRow(
  profile: AdminDirectorySortRowProfile,
  role: AdminDirectoryRole,
  extras: AdminDirectorySortRowExtras,
): AdminUserRow {
  const sections = extras.sectionsByPerson.get(profile.id) ?? [];
  return {
    id: profile.id,
    email: extras.emailById.get(profile.id) ?? "",
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    role: profile.role ?? "",
    phone: profile.phone?.trim() ?? "",
    avatarDisplayUrl: null,
    missingSection: role === "student" && sections.length === 0,
    ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
    sections,
    parents: extras.parentsByStudent.get(profile.id) ?? [],
    children: extras.childrenByParent.get(profile.id) ?? [],
    monthlyDue: extras.monthlyDueByStudent.get(profile.id) ?? [],
    ...directoryBillingRowFields(extras.billingFlagsByPerson.get(profile.id)),
    lastSessionStartAt: profile.last_session_start_at,
    emailDeliverable: extras.deliverable.get(profile.id) ?? false,
  };
}
