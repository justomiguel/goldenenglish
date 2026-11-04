export const FREE_SITE_MESSAGE_PAGE_SIZE = 20;

export function freeSiteMessageRange(page: number): { page: number; from: number; to: number } {
  const safe = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safe - 1) * FREE_SITE_MESSAGE_PAGE_SIZE;
  return { page: safe, from, to: from + FREE_SITE_MESSAGE_PAGE_SIZE - 1 };
}
