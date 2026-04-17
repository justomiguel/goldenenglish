import type { Dictionary } from "@/types/i18n";
import {
  TeacherSidebarNavContent,
  type AdminWorkspaceNavLabels,
} from "@/components/dashboard/TeacherSidebarNavContent";

export type { AdminWorkspaceNavLabels } from "@/components/dashboard/TeacherSidebarNavContent";

export interface TeacherSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["teacherNav"];
  adminNav?: AdminWorkspaceNavLabels;
}

export function TeacherSidebar({ locale, dict, adminNav }: TeacherSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-5 md:pl-2 md:pr-2 md:shadow-sm">
      <TeacherSidebarNavContent locale={locale} dict={dict} adminNav={adminNav} />
    </aside>
  );
}
