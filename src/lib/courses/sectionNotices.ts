export type SectionNoticeRow = {
  id: string;
  sectionId: string;
  body: string;
  publishedAt: string;
  archivedAt: string | null;
};

export function selectSectionNotices(
  notices: readonly SectionNoticeRow[],
  sectionIds: readonly string[],
  limitPerSection = 5,
): SectionNoticeRow[] {
  const allowed = new Set(sectionIds);
  const grouped = new Map<string, SectionNoticeRow[]>();
  const active = notices
    .filter((notice) => notice.archivedAt === null && allowed.has(notice.sectionId))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  for (const notice of active) {
    const bucket = grouped.get(notice.sectionId) ?? [];
    if (bucket.length >= limitPerSection) continue;
    bucket.push(notice);
    grouped.set(notice.sectionId, bucket);
  }
  return [...grouped.values()].flat().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
