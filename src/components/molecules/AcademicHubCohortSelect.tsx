"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/atoms/Label";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { hubCohortHref, type HubCohortOption } from "@/lib/academics/resolveHubCohortSelection";

export interface AcademicHubCohortSelectProps {
  label: string;
  placeholder: string;
  currentMark: string;
  archivedMark: string;
  options: readonly HubCohortOption[];
  selectedId: string | null;
}

function optionLabel(option: HubCohortOption, currentMark: string, archivedMark: string): string {
  if (option.isCurrent) return `${option.name} · ${currentMark}`;
  if (option.archivedAt != null) return `${option.name} · ${archivedMark}`;
  return option.name;
}

export function AcademicHubCohortSelect({
  label,
  placeholder,
  currentMark,
  archivedMark,
  options,
  selectedId,
}: AcademicHubCohortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" data-tour={ADMIN_TOUR_ANCHORS.academicBoardTabs}>
      <div className="min-w-0 sm:max-w-sm sm:flex-1">
        <Label htmlFor="hub-cohort">{label}</Label>
        <select
          id="hub-cohort"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          value={selectedId ?? ""}
          onChange={(event) => {
            const nextId = event.target.value;
            if (nextId.length === 0) return;
            router.replace(hubCohortHref(pathname, searchParams.toString(), nextId));
          }}
        >
          {selectedId == null ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {optionLabel(option, currentMark, archivedMark)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
