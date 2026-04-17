import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

export type TeacherAttendanceScope = "operational" | "full";

export interface TeacherAttendanceScopeLinksProps {
  locale: string;
  sectionId: string;
  active: TeacherAttendanceScope;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["scopeLinks"];
}

function href(locale: string, sectionId: string, scope: TeacherAttendanceScope): string {
  const base = `/${locale}/dashboard/teacher/sections/${sectionId}/attendance`;
  return scope === "full" ? `${base}?scope=full` : base;
}

export function TeacherAttendanceScopeLinks({ locale, sectionId, active, dict }: TeacherAttendanceScopeLinksProps) {
  const opActive = active === "operational";
  const fullActive = active === "full";
  const chip =
    "inline-flex min-h-10 items-center rounded-[var(--layout-border-radius)] border px-3 py-2 text-sm font-medium transition";
  const activeCls =
    "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm";
  const idleCls =
    "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]/85 hover:bg-[var(--color-muted)]";

  return (
    <nav aria-label={dict.aria} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={href(locale, sectionId, "operational")}
          className={`${chip} ${opActive ? activeCls : idleCls}`}
          aria-current={opActive ? "page" : undefined}
        >
          {dict.operational}
        </Link>
        <Link
          href={href(locale, sectionId, "full")}
          className={`${chip} ${fullActive ? activeCls : idleCls}`}
          aria-current={fullActive ? "page" : undefined}
        >
          {dict.fullCourse}
        </Link>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {fullActive ? dict.fullCourseHint : dict.operationalHint}
      </p>
    </nav>
  );
}
