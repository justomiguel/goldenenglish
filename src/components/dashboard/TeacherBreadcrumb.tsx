"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface TeacherBreadcrumbProps {
  locale: string;
  dict: Dictionary["dashboard"]["teacherNav"];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segmentLabel(segment: string, dict: TeacherBreadcrumbProps["dict"]): string | null {
  if (UUID_RE.test(segment)) return null;

  const map: Record<string, string> = {
    sections: dict.sections,
    academics: dict.academics,
    messages: dict.messages,
    attendance: dict.breadcrumbAttendance,
    assessments: dict.breadcrumbAssessments,
  };

  return map[segment] ?? null;
}

export function TeacherBreadcrumb({ locale, dict }: TeacherBreadcrumbProps) {
  const pathname = usePathname();
  const teacherBase = `/${locale}/dashboard/teacher`;

  if (!pathname.startsWith(teacherBase) || pathname === teacherBase) return null;

  const relative = pathname.slice(teacherBase.length);
  const segments = relative.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [{ label: dict.breadcrumbTeacher, href: teacherBase }];

  let accumulated = teacherBase;
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = segmentLabel(seg, dict);
    if (label) {
      crumbs.push({ label, href: accumulated });
    }
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label={dict.breadcrumbNavAria}
      className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted-foreground)]"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />}
            {isLast ? (
              <span className="font-medium text-[var(--color-foreground)]" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-sm transition hover:text-[var(--color-foreground)] hover:underline"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
