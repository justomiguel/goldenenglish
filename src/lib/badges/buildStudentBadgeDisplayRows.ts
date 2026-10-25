import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";
import { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
import { computeBadgeEntryProgress } from "@/lib/badges/computeBadgeEntryProgress";
import type { StudentBadgeEvaluationContext } from "@/lib/badges/evaluateBadgeCatalogEligibility";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import { sortStudentBadgeDisplayRows } from "@/lib/badges/sortStudentBadgeDisplayRows";
import type { StudentBadgeRowModel } from "@/types/studentBadges";

export type BadgeGrantRow = {
  id: string;
  badge_code: string;
  earned_at: string;
  public_share_token: string;
};

function catalogToRowCatalog(entry: BadgeCatalogEntry, supabaseProjectUrl?: string | null) {
  return {
    category: entry.category,
    imageUrl: badgeImagePublicUrl(entry.imagePath, supabaseProjectUrl),
    translations: entry.translations,
  };
}

/**
 * Merges active catalog entries with grants: earned badges plus locked rows with progress.
 */
export function buildStudentBadgeDisplayRows(params: {
  catalog: ReadonlyArray<BadgeCatalogEntry>;
  grants: BadgeGrantRow[];
  ctx: StudentBadgeEvaluationContext;
  shareUrlForToken: (token: string, title?: string) => string;
  supabaseProjectUrl?: string | null;
}): StudentBadgeRowModel[] {
  const { catalog, grants, ctx, shareUrlForToken, supabaseProjectUrl } = params;
  const grantByCode = new Map<string, BadgeGrantRow>();
  for (const g of grants) {
    if (isStudentBadgeCode(g.badge_code)) grantByCode.set(g.badge_code, g);
  }

  const rows: StudentBadgeRowModel[] = [];
  const seenCodes = new Set<string>();

  for (const entry of catalog) {
    if (!entry.isActive) continue;
    seenCodes.add(entry.code);
    const grant = grantByCode.get(entry.code);
    if (grant) {
      rows.push({
        id: grant.id,
        badgeCode: entry.code,
        earnedAt: grant.earned_at,
        shareUrl: shareUrlForToken(
          grant.public_share_token,
          entry.translations.es?.title ?? entry.translations.en?.title ?? entry.code,
        ),
        locked: false,
        progress: null,
        catalog: catalogToRowCatalog(entry, supabaseProjectUrl),
      });
      continue;
    }

    const progress = computeBadgeEntryProgress(entry, ctx);
    rows.push({
      id: `locked-${entry.code}`,
      badgeCode: entry.code,
      earnedAt: null,
      shareUrl: "",
      locked: true,
      progress: {
        current: progress.current,
        target: progress.target,
        percent: progress.percent,
      },
      catalog: catalogToRowCatalog(entry, supabaseProjectUrl),
    });
  }

  for (const grant of grants) {
    if (!isStudentBadgeCode(grant.badge_code) || seenCodes.has(grant.badge_code)) continue;
    rows.push({
      id: grant.id,
      badgeCode: grant.badge_code,
      earnedAt: grant.earned_at,
      shareUrl: shareUrlForToken(grant.public_share_token, grant.badge_code),
      locked: false,
      progress: null,
      catalog: undefined,
    });
  }

  return sortStudentBadgeDisplayRows(rows);
}
