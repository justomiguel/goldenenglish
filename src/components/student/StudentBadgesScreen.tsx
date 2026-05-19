import { BadgeAchievementCard } from "@/components/molecules/BadgeAchievementCard";
import { badgeCategoryLabel } from "@/lib/badges/badgeCategoryLabel";
import { resolveBadgeTranslation, type BadgeCategory } from "@/lib/badges/badgeCatalog";
import { studentBadgeCategory } from "@/lib/badges/badgeCategory";
import { formatBadgeProgressDetail } from "@/lib/badges/formatBadgeProgressDetail";
import { resolveBadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";
import { StudentBadgeShareControls } from "@/components/student/StudentBadgeShareControls";
import type { Dictionary, Locale } from "@/types/i18n";
import type { StudentBadgeRowModel } from "@/types/studentBadges";

type BadgesDict = Dictionary["dashboard"]["student"]["badges"];
type Defs = BadgesDict["definitions"];

function dictionaryFallback(defs: Defs, code: string): { title: string; description: string } {
  const entry = defs[code as keyof Defs];
  if (entry && typeof entry === "object" && "title" in entry) {
    return { title: String(entry.title), description: String(entry.description) };
  }
  return { title: code, description: "" };
}

function resolveCopy(
  row: StudentBadgeRowModel,
  defs: Defs,
  locale: string,
): { title: string; description: string; category: BadgeCategory } {
  if (row.catalog) {
    const t = resolveBadgeTranslation({ code: row.badgeCode, translations: row.catalog.translations }, locale);
    return { title: t.title, description: t.description, category: row.catalog.category };
  }
  const fallback = dictionaryFallback(defs, row.badgeCode);
  return { ...fallback, category: studentBadgeCategory(row.badgeCode) };
}

function formatUnlocked(earnedAt: string, template: string, locale: string): string {
  const d = new Date(earnedAt);
  if (Number.isNaN(d.getTime())) return template.replace("{date}", earnedAt);
  const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
  return template.replace("{date}", dateStr);
}

export interface StudentBadgesScreenProps {
  locale: Locale;
  rows: StudentBadgeRowModel[];
  dict: BadgesDict;
}

export function StudentBadgesScreen({ locale, rows, dict }: StudentBadgesScreenProps) {
  const shareLabels = {
    copyLink: dict.copyLink,
    share: dict.share,
    linkCopied: dict.linkCopied,
    copyFailed: dict.copyFailed,
  };

  const hasCatalogRows = rows.length > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {dict.kicker}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{dict.title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.howItWorks}</p>
      </header>

      {!hasCatalogRows ? (
        <p
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {dict.empty}
        </p>
      ) : (
        <ul className="space-y-4" aria-label={dict.title}>
          {rows.map((row) => {
            const { title, description, category } = resolveCopy(row, dict.definitions, locale);
            const visual = resolveBadgeAchievementVisual(category, row.badgeCode);
            const progressDetail =
              row.locked && row.progress
                ? formatBadgeProgressDetail(locale, row.progress, {
                    progressFraction: dict.progressFraction,
                    progressComplete: dict.progressComplete,
                  })
                : undefined;
            return (
              <li key={row.id}>
                <BadgeAchievementCard
                  visual={visual}
                  categoryLabel={badgeCategoryLabel(category, dict)}
                  title={title}
                  description={description || undefined}
                  statusLine={
                    row.locked
                      ? dict.lockedStatus
                      : formatUnlocked(row.earnedAt ?? "", dict.unlocked, locale)
                  }
                  imageUrl={row.catalog?.imageUrl ?? null}
                  locked={row.locked}
                  progress={row.progress}
                  progressDetail={progressDetail}
                  progressAriaLabel={dict.progressAria.replace("{title}", title)}
                  footer={
                    row.locked ? undefined : (
                      <StudentBadgeShareControls
                        shareUrl={row.shareUrl}
                        labels={shareLabels}
                        badgeCode={row.badgeCode}
                      />
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type { StudentBadgeRowModel } from "@/types/studentBadges";
