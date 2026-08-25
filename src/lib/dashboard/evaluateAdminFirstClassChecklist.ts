export const ADMIN_FIRST_CLASS_CHECKLIST_ITEM_IDS = [
  "createStudent",
  "createTeacher",
  "createCohortAndSection",
  "assignTeacher",
  "enrollStudent",
  "setSchedule",
  "setFees",
  "setPaymentMethod",
] as const;

export type AdminFirstClassChecklistItemId =
  (typeof ADMIN_FIRST_CLASS_CHECKLIST_ITEM_IDS)[number];

export type AdminFirstClassChecklistFacts = {
  hasStudent: boolean;
  hasTeacher: boolean;
  hasCohort: boolean;
  hasSection: boolean;
  hasTeacherAssignedToSection: boolean;
  hasStudentEnrolledInSection: boolean;
  hasSectionSchedule: boolean;
  hasSectionFees: boolean;
  hasPaymentMethod: boolean;
};

export type AdminFirstClassChecklistSectionTarget = {
  id: string;
  cohortId: string;
  hasTeacher: boolean;
  hasSchedule: boolean;
  hasFees: boolean;
};

export type AdminFirstClassChecklistContext = {
  firstCohortId: string | null;
  sections: AdminFirstClassChecklistSectionTarget[];
};

const EMPTY_CONTEXT: AdminFirstClassChecklistContext = {
  firstCohortId: null,
  sections: [],
};

export type AdminFirstClassChecklistItem = {
  id: AdminFirstClassChecklistItemId;
  done: boolean;
  href: string;
};

export type AdminFirstClassChecklist = {
  items: AdminFirstClassChecklistItem[];
  doneCount: number;
  totalCount: number;
  allDone: boolean;
};

function academicHref(
  locale: string,
  section: AdminFirstClassChecklistSectionTarget | null,
  firstCohortId: string | null,
): string {
  const base = `/${locale}/dashboard/admin/academic`;
  if (section) return `${base}/${section.cohortId}/${section.id}`;
  if (firstCohortId) return `${base}/${firstCohortId}`;
  return base;
}

function firstSection(
  context: AdminFirstClassChecklistContext,
): AdminFirstClassChecklistSectionTarget | null {
  return context.sections[0] ?? null;
}

function sectionMissing(
  context: AdminFirstClassChecklistContext,
  key: "hasTeacher" | "hasSchedule" | "hasFees",
): AdminFirstClassChecklistSectionTarget | null {
  return context.sections.find((section) => !section[key]) ?? firstSection(context);
}

function hrefFor(
  id: AdminFirstClassChecklistItemId,
  locale: string,
  context: AdminFirstClassChecklistContext,
): string {
  const base = `/${locale}/dashboard/admin`;
  switch (id) {
    case "createStudent":
      return `${base}/users/new?role=student`;
    case "createTeacher":
      return `${base}/users/new?role=teacher`;
    case "setPaymentMethod":
      return `${base}/finance?tab=settings`;
    case "createCohortAndSection":
      return academicHref(locale, null, context.firstCohortId);
    case "enrollStudent":
      return academicHref(locale, firstSection(context), context.firstCohortId);
    case "assignTeacher":
      return academicHref(locale, sectionMissing(context, "hasTeacher"), context.firstCohortId);
    case "setSchedule":
      return academicHref(locale, sectionMissing(context, "hasSchedule"), context.firstCohortId);
    case "setFees":
      return academicHref(locale, sectionMissing(context, "hasFees"), context.firstCohortId);
  }
}

function isDone(
  id: AdminFirstClassChecklistItemId,
  facts: AdminFirstClassChecklistFacts,
): boolean {
  switch (id) {
    case "createStudent":
      return facts.hasStudent;
    case "createTeacher":
      return facts.hasTeacher;
    case "createCohortAndSection":
      return facts.hasCohort && facts.hasSection;
    case "assignTeacher":
      return facts.hasTeacherAssignedToSection;
    case "enrollStudent":
      return facts.hasStudentEnrolledInSection;
    case "setSchedule":
      return facts.hasSectionSchedule;
    case "setFees":
      return facts.hasSectionFees;
    case "setPaymentMethod":
      return facts.hasPaymentMethod;
  }
}

export function evaluateAdminFirstClassChecklist(
  facts: AdminFirstClassChecklistFacts,
  locale: string,
  context: AdminFirstClassChecklistContext = EMPTY_CONTEXT,
): AdminFirstClassChecklist {
  const items = ADMIN_FIRST_CLASS_CHECKLIST_ITEM_IDS.map((id) => ({
    id,
    done: isDone(id, facts),
    href: hrefFor(id, locale, context),
  }));
  const doneCount = items.filter((item) => item.done).length;
  return {
    items,
    doneCount,
    totalCount: items.length,
    allDone: doneCount === items.length,
  };
}
