export type AdminDirectoryRole = "student" | "teacher" | "parent";

export type DirectoryBinaryFilter = "with" | "without";
export type DirectoryAccessFilter = "never" | "entered";
export type DirectoryCreatedFilter = "last30" | "older";
export type DirectoryTeachingRoleFilter = "lead" | "assistant";
export type DirectoryEmailFilter = "deliverable" | "none";

export type AdminDirectoryFilters = {
  section?: string;
  access?: DirectoryAccessFilter;
  phone?: DirectoryBinaryFilter;
  created?: DirectoryCreatedFilter;
  enrollment?: DirectoryBinaryFilter;
  teachingRole?: DirectoryTeachingRoleFilter;
  parentLink?: DirectoryBinaryFilter;
  scholarship?: DirectoryBinaryFilter;
  due?: DirectoryBinaryFilter;
  email?: DirectoryEmailFilter;
  children?: DirectoryBinaryFilter;
};

export type AdminDirectoryFilterKey = keyof AdminDirectoryFilters;

export type AdminDirectoryCandidate = {
  id: string;
  phone: string;
  createdAt: string | null;
  lastSessionStartAt: string | null;
  sectionIds: string[];
  leadSectionIds: string[];
  assistantSectionIds: string[];
  hasParentLink: boolean;
  hasScholarship: boolean;
  hasDue: boolean;
  emailDeliverable: boolean;
  hasChildren: boolean;
};

const STUDENT_KEYS = [
  "section",
  "access",
  "phone",
  "created",
  "enrollment",
  "parentLink",
  "scholarship",
  "due",
] as const satisfies readonly AdminDirectoryFilterKey[];

const TEACHER_KEYS = [
  "section",
  "access",
  "phone",
  "created",
  "enrollment",
  "teachingRole",
] as const satisfies readonly AdminDirectoryFilterKey[];

const PARENT_KEYS = [
  "section",
  "access",
  "phone",
  "created",
  "email",
  "children",
] as const satisfies readonly AdminDirectoryFilterKey[];

const KEYS_BY_ROLE: Record<AdminDirectoryRole, readonly AdminDirectoryFilterKey[]> = {
  student: STUDENT_KEYS,
  teacher: TEACHER_KEYS,
  parent: PARENT_KEYS,
};

export function adminDirectoryFilterKeys(role: AdminDirectoryRole): readonly AdminDirectoryFilterKey[] {
  return KEYS_BY_ROLE[role];
}

function asString(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function parseBinary(raw: string): DirectoryBinaryFilter | undefined {
  return raw === "with" || raw === "without" ? raw : undefined;
}

function parseAccess(raw: string): DirectoryAccessFilter | undefined {
  return raw === "never" || raw === "entered" ? raw : undefined;
}

function parseCreated(raw: string): DirectoryCreatedFilter | undefined {
  return raw === "last30" || raw === "older" ? raw : undefined;
}

function parseTeachingRole(raw: string): DirectoryTeachingRoleFilter | undefined {
  return raw === "lead" || raw === "assistant" ? raw : undefined;
}

function parseEmail(raw: string): DirectoryEmailFilter | undefined {
  return raw === "deliverable" || raw === "none" ? raw : undefined;
}

export function parseAdminDirectoryFilters(
  role: AdminDirectoryRole,
  raw: Record<string, unknown>,
): AdminDirectoryFilters {
  const allowed = new Set(KEYS_BY_ROLE[role]);
  const out: AdminDirectoryFilters = {};
  const section = asString(raw.section);
  if (allowed.has("section") && section) out.section = section;
  if (allowed.has("access")) {
    const access = parseAccess(asString(raw.access));
    if (access) out.access = access;
  }
  if (allowed.has("phone")) {
    const phone = parseBinary(asString(raw.phone));
    if (phone) out.phone = phone;
  }
  if (allowed.has("created")) {
    const created = parseCreated(asString(raw.created));
    if (created) out.created = created;
  }
  if (allowed.has("enrollment")) {
    const enrollment = parseBinary(asString(raw.enrollment));
    if (enrollment) out.enrollment = enrollment;
  }
  if (allowed.has("teachingRole")) {
    const teachingRole = parseTeachingRole(asString(raw.teachingRole));
    if (teachingRole) out.teachingRole = teachingRole;
  }
  if (allowed.has("parentLink")) {
    const parentLink = parseBinary(asString(raw.parentLink));
    if (parentLink) out.parentLink = parentLink;
  }
  if (allowed.has("scholarship")) {
    const scholarship = parseBinary(asString(raw.scholarship));
    if (scholarship) out.scholarship = scholarship;
  }
  if (allowed.has("due")) {
    const due = parseBinary(asString(raw.due));
    if (due) out.due = due;
  }
  if (allowed.has("email")) {
    const email = parseEmail(asString(raw.email));
    if (email) out.email = email;
  }
  if (allowed.has("children")) {
    const children = parseBinary(asString(raw.children));
    if (children) out.children = children;
  }
  return out;
}

export function adminDirectoryFiltersActive(filters: AdminDirectoryFilters): boolean {
  return Object.values(filters).some((value) => value != null && value !== "");
}

export function adminDirectoryFiltersToParams(filters: AdminDirectoryFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) out[key] = value;
  }
  return out;
}

export function clearedDirectoryFilterParams(): Record<AdminDirectoryFilterKey, undefined> {
  return {
    section: undefined,
    access: undefined,
    phone: undefined,
    created: undefined,
    enrollment: undefined,
    teachingRole: undefined,
    parentLink: undefined,
    scholarship: undefined,
    due: undefined,
    email: undefined,
    children: undefined,
  };
}

export const ADMIN_DIRECTORY_FILTER_PARAM_KEYS = [
  "section",
  "access",
  "phone",
  "created",
  "enrollment",
  "teachingRole",
  "parentLink",
  "scholarship",
  "due",
  "email",
  "children",
] as const satisfies readonly AdminDirectoryFilterKey[];
