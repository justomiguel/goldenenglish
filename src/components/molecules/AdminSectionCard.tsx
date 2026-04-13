import Link from "next/link";
import { SectionCapacityBar } from "@/components/molecules/SectionCapacityBar";

export interface AdminSectionCardProps {
  href: string;
  name: string;
  activeCount: number;
  maxStudents: number;
  capacityLabel: string;
}

export function AdminSectionCard({
  href,
  name,
  activeCount,
  maxStudents,
  capacityLabel,
}: AdminSectionCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <Link href={href} className="text-base font-semibold text-[var(--color-primary)] hover:underline">
        {name}
      </Link>
      <SectionCapacityBar
        activeCount={activeCount}
        maxStudents={maxStudents}
        label={capacityLabel}
      />
    </article>
  );
}
