import type { AdminDirectoryFilterKey } from "@/lib/dashboard/adminDirectoryFilters";
import type { AdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["directoryFilters"];

function optionLabel(template: string, label: string, count: number): string {
  return template.replace(/\{\{label\}\}/g, label).replace(/\{\{count\}\}/g, String(count));
}

function binaryOptions(
  labels: Labels,
  allLabel: string,
  withLabel: string,
  withoutLabel: string,
  facet: { all: number; with: number; without: number },
): { value: string; label: string }[] {
  return [
    { value: "", label: optionLabel(labels.optionWithCount, allLabel, facet.all) },
    { value: "with", label: optionLabel(labels.optionWithCount, withLabel, facet.with) },
    { value: "without", label: optionLabel(labels.optionWithCount, withoutLabel, facet.without) },
  ];
}

export function adminDirectoryFilterComboOptions(
  key: AdminDirectoryFilterKey,
  labels: Labels,
  facets: AdminDirectoryFacets,
  sectionOptions: { id: string; name: string }[],
): { value: string; label: string }[] {
  if (key === "section") {
    return [
      { value: "", label: optionLabel(labels.optionWithCount, labels.sectionAll, facets.sectionAll) },
      ...sectionOptions.map((section) => ({
        value: section.id,
        label: optionLabel(labels.optionWithCount, section.name, facets.section[section.id] ?? 0),
      })),
    ];
  }
  if (key === "access") {
    return [
      { value: "", label: optionLabel(labels.optionWithCount, labels.accessAll, facets.access.all) },
      { value: "never", label: optionLabel(labels.optionWithCount, labels.accessNever, facets.access.never) },
      { value: "entered", label: optionLabel(labels.optionWithCount, labels.accessEntered, facets.access.entered) },
    ];
  }
  if (key === "created") {
    return [
      { value: "", label: optionLabel(labels.optionWithCount, labels.createdAll, facets.created.all) },
      { value: "last30", label: optionLabel(labels.optionWithCount, labels.createdLast30, facets.created.last30) },
      { value: "older", label: optionLabel(labels.optionWithCount, labels.createdOlder, facets.created.older) },
    ];
  }
  if (key === "teachingRole") {
    return [
      { value: "", label: optionLabel(labels.optionWithCount, labels.teachingRoleAll, facets.teachingRole.all) },
      { value: "lead", label: optionLabel(labels.optionWithCount, labels.teachingRoleLead, facets.teachingRole.lead) },
      {
        value: "assistant",
        label: optionLabel(labels.optionWithCount, labels.teachingRoleAssistant, facets.teachingRole.assistant),
      },
    ];
  }
  if (key === "email") {
    return [
      { value: "", label: optionLabel(labels.optionWithCount, labels.emailAll, facets.email.all) },
      {
        value: "deliverable",
        label: optionLabel(labels.optionWithCount, labels.emailDeliverable, facets.email.deliverable),
      },
      { value: "none", label: optionLabel(labels.optionWithCount, labels.emailNone, facets.email.none) },
    ];
  }
  if (key === "age") {
    const bands: { value: string; label: string; count: number }[] = [
      { value: "", label: labels.ageAll, count: facets.age.all },
      { value: "unknown", label: labels.ageUnknown, count: facets.age.unknown },
      { value: "0-2", label: labels.age0to2, count: facets.age["0-2"] },
      { value: "3-5", label: labels.age3to5, count: facets.age["3-5"] },
      { value: "6-8", label: labels.age6to8, count: facets.age["6-8"] },
      { value: "9-12", label: labels.age9to12, count: facets.age["9-12"] },
      { value: "13-17", label: labels.age13to17, count: facets.age["13-17"] },
      { value: "18+", label: labels.age18plus, count: facets.age["18+"] },
    ];
    return bands.map((band) => ({
      value: band.value,
      label: optionLabel(labels.optionWithCount, band.label, band.count),
    }));
  }
  if (key === "monthlyStatus") {
    return [
      { value: "", label: optionLabel(labels.optionWithCount, labels.monthlyStatusAll, facets.monthlyStatus.all) },
      {
        value: "current",
        label: optionLabel(labels.optionWithCount, labels.monthlyStatusCurrent, facets.monthlyStatus.current),
      },
      {
        value: "behind",
        label: optionLabel(labels.optionWithCount, labels.monthlyStatusBehind, facets.monthlyStatus.behind),
      },
      { value: "na", label: optionLabel(labels.optionWithCount, labels.monthlyStatusNa, facets.monthlyStatus.na) },
    ];
  }
  const binary: Record<
    Extract<AdminDirectoryFilterKey, "phone" | "enrollment" | "parentLink" | "scholarship" | "due" | "children">,
    [string, string, string, { all: number; with: number; without: number }]
  > = {
    phone: [labels.phoneAll, labels.phoneWith, labels.phoneWithout, facets.phone],
    enrollment: [labels.enrollmentAll, labels.enrollmentWith, labels.enrollmentWithout, facets.enrollment],
    parentLink: [labels.parentLinkAll, labels.parentLinkWith, labels.parentLinkWithout, facets.parentLink],
    scholarship: [labels.scholarshipAll, labels.scholarshipWith, labels.scholarshipWithout, facets.scholarship],
    due: [labels.dueAll, labels.dueWith, labels.dueWithout, facets.due],
    children: [labels.childrenAll, labels.childrenWith, labels.childrenWithout, facets.children],
  };
  const pack = binary[key as keyof typeof binary];
  return pack ? binaryOptions(labels, pack[0], pack[1], pack[2], pack[3]) : [];
}

export function adminDirectoryFilterComboTitle(key: AdminDirectoryFilterKey, labels: Labels): string {
  const titles: Record<AdminDirectoryFilterKey, string> = {
    section: labels.section,
    access: labels.access,
    phone: labels.phone,
    created: labels.created,
    enrollment: labels.enrollment,
    teachingRole: labels.teachingRole,
    parentLink: labels.parentLink,
    scholarship: labels.scholarship,
    due: labels.due,
    monthlyStatus: labels.monthlyStatus,
    email: labels.email,
    children: labels.children,
    age: labels.age,
  };
  return titles[key];
}
