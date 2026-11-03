import type { SectionNoticeRow } from "@/lib/courses/sectionNotices";

interface SectionNoticeListProps {
  title: string;
  notices: readonly Pick<SectionNoticeRow, "id" | "body">[];
}

export function SectionNoticeList({ title, notices }: SectionNoticeListProps) {
  if (notices.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
      <ul className="space-y-2">
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)]"
          >
            {notice.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
