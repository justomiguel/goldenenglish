import type { Dictionary } from "@/types/i18n";
import { StudentSidebarNavContent } from "@/components/dashboard/StudentSidebarNavContent";

export interface StudentSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["studentNav"];
}

export function StudentSidebar({ locale, dict }: StudentSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-5 md:pl-2 md:pr-2 md:shadow-sm">
      <StudentSidebarNavContent locale={locale} dict={dict} />
    </aside>
  );
}
