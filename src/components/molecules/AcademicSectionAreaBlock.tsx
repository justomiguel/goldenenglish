import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AcademicSectionAreaBlockHeader } from "@/components/molecules/AcademicSectionAreaBlockHeader";

export interface AcademicSectionAreaBlockProps {
  id: string;
  title: string;
  lead: string;
  icon: LucideIcon;
  children: ReactNode;
}

export function AcademicSectionAreaBlock({
  id,
  title,
  lead,
  icon,
  children,
}: AcademicSectionAreaBlockProps) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
    >
      <AcademicSectionAreaBlockHeader id={id} title={title} lead={lead} icon={icon} />
      <div className="space-y-5">{children}</div>
    </section>
  );
}
