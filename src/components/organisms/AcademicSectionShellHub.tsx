"use client";

import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Route,
  Settings2,
  Users,
} from "lucide-react";
import type { AcademicSectionShellAreaId } from "@/lib/academics/academicSectionShellTabOrder";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

const AREA_ICONS: Record<AcademicSectionShellAreaId, LucideIcon> = {
  configuration: Settings2,
  teachers: GraduationCap,
  learningRoute: Route,
  evaluations: ClipboardCheck,
  fees: CircleDollarSign,
  attendance: ClipboardList,
  students: Users,
};

export interface AcademicSectionShellHubCardLabels {
  title: string;
  lead: string;
}

export interface AcademicSectionShellHubProps {
  areasAria: string;
  areas: readonly AcademicSectionShellAreaId[];
  cardLabels: Record<AcademicSectionShellAreaId, AcademicSectionShellHubCardLabels>;
  onOpenArea: (area: AcademicSectionShellAreaId) => void;
}

export function AcademicSectionShellHub({
  areasAria,
  areas,
  cardLabels,
  onOpenArea,
}: AcademicSectionShellHubProps) {
  return (
    <div
      data-tour={ADMIN_TOUR_ANCHORS.sectionDetailTabs}
      role="navigation"
      aria-label={areasAria}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {areas.map((area) => {
        const Icon = AREA_ICONS[area];
        const { title, lead } = cardLabels[area];
        return (
          <button
            key={area}
            type="button"
            onClick={() => onOpenArea(area)}
            className="flex min-h-[44px] flex-col items-start gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--color-foreground)]">
              <Icon className="h-8 w-8 shrink-0 text-[var(--color-primary)]" aria-hidden />
              {title}
            </span>
            <span className="text-sm text-[var(--color-muted-foreground)] text-balance">{lead}</span>
          </button>
        );
      })}
    </div>
  );
}
