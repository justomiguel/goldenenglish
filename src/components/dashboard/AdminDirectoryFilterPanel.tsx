"use client";

import { useId, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  adminDirectoryFilterKeys,
  adminDirectoryFiltersActive,
  type AdminDirectoryFilterKey,
  type AdminDirectoryFilters,
  type AdminDirectoryRole,
} from "@/lib/dashboard/adminDirectoryFilters";
import type { AdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["directoryFilters"];

export type AdminDirectoryFilterPanelProps = {
  role: AdminDirectoryRole;
  labels: Labels;
  values: AdminDirectoryFilters;
  facets: AdminDirectoryFacets;
  sectionOptions: { id: string; name: string }[];
  onChange: (key: AdminDirectoryFilterKey, value: string | undefined) => void;
  onClear: () => void;
};

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

function comboOptions(
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

function comboTitle(key: AdminDirectoryFilterKey, labels: Labels): string {
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
    email: labels.email,
    children: labels.children,
  };
  return titles[key];
}

export function AdminDirectoryFilterPanel({
  role,
  labels,
  values,
  facets,
  sectionOptions,
  onChange,
  onClear,
}: AdminDirectoryFilterPanelProps) {
  const formId = useId();
  const panelId = `${formId}-panel`;
  const filtersActive = adminDirectoryFiltersActive(values);
  const [open, setOpen] = useState(filtersActive);
  const keys = adminDirectoryFilterKeys(role);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 gap-2 rounded-xl border border-[var(--color-border)] px-4"
        aria-expanded={open}
        aria-controls={panelId}
        title={open ? labels.toggleCollapse : labels.toggleExpand}
        onClick={() => setOpen((v) => !v)}
      >
        <Filter className="h-4 w-4 shrink-0" aria-hidden />
        <span className="inline-flex items-center gap-2">
          {labels.toggle}
          {filtersActive ? (
            <span
              data-active-dot
              className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]"
              aria-hidden
            />
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>

      <section
        id={panelId}
        hidden={!open}
        aria-label={labels.panelAria}
        className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] md:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {keys.map((key) => (
            <label key={key} className="block text-sm" htmlFor={`${formId}-${key}`}>
              <span className="mb-1 block text-[var(--color-muted-foreground)]">{comboTitle(key, labels)}</span>
              <select
                id={`${formId}-${key}`}
                value={(values[key] as string | undefined) ?? ""}
                onChange={(e) => onChange(key, e.target.value || undefined)}
                className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {comboOptions(key, labels, facets, sectionOptions).map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {filtersActive ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl border border-[var(--color-border)]"
              onClick={onClear}
            >
              {labels.clear}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
