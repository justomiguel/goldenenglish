import { AssistantSidebarNavContent } from "@/components/dashboard/AssistantSidebarNavContent";
import type { Dictionary } from "@/types/i18n";

export interface AssistantSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["assistantNav"];
}

export function AssistantSidebar({ locale, dict }: AssistantSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-5 md:pl-2 md:pr-2 md:shadow-sm">
      <AssistantSidebarNavContent locale={locale} dict={dict} />
    </aside>
  );
}
