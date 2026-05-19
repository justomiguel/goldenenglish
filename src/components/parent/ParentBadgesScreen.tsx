import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import { BadgeAchievementCard } from "@/components/molecules/BadgeAchievementCard";
import { badgeCategoryLabel } from "@/lib/badges/badgeCategoryLabel";
import type { StudentBadgeRowModel } from "@/types/studentBadges";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import { resolveBadgeTranslation, type BadgeCategory } from "@/lib/badges/badgeCatalog";
import { studentBadgeCategory } from "@/lib/badges/badgeCategory";
import { formatBadgeProgressDetail } from "@/lib/badges/formatBadgeProgressDetail";
import { resolveBadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";

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
    const t = resolveBadgeTranslation(
      { code: row.badgeCode, translations: row.catalog.translations },
      locale,
    );
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

interface ParentBadgesScreenProps {
  locale: string;
  rows: StudentBadgeRowModel[];
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  parentLabels: Dictionary["dashboard"]["parent"];
  badgesDict: BadgesDict;
  embedded?: boolean;
}

export function ParentBadgesScreen({
  locale,
  rows,
  wardOptions,
  selectedStudentId,
  parentLabels,
  badgesDict,
  embedded = false,
}: ParentBadgesScreenProps) {
  const basePath = `/${locale}/dashboard/parent/badges`;
  const hasCatalogRows = rows.length > 0;

  return (
    <div className={embedded ? "space-y-3" : "space-y-6"}>
      {embedded ? null : (
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {parentLabels.badgesPageKicker}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {parentLabels.badgesPageTitle}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{parentLabels.badgesPageLead}</p>
        </header>
      )}

      {embedded ? null : (
        <ParentWardPicker
          options={wardOptions}
          selectedStudentId={selectedStudentId}
          label={parentLabels.wardPickerLabel}
          hint={parentLabels.wardPickerHint}
          basePath={basePath}
        />
      )}

      {!hasCatalogRows ? (
        <p
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {parentLabels.badgesPageEmpty}
        </p>
      ) : (
        <ul className="space-y-4" aria-label={parentLabels.badgesPageTitle}>
          {rows.map((row) => {
            const { title, description, category } = resolveCopy(
              row,
              badgesDict.definitions,
              locale,
            );
            const visual = resolveBadgeAchievementVisual(category, row.badgeCode);
            const progressDetail =
              row.locked && row.progress
                ? formatBadgeProgressDetail(locale as Locale, row.progress, {
                    progressFraction: badgesDict.progressFraction,
                    progressComplete: badgesDict.progressComplete,
                  })
                : undefined;
            return (
              <li key={row.id}>
                <BadgeAchievementCard
                  visual={visual}
                  categoryLabel={badgeCategoryLabel(category, badgesDict)}
                  title={title}
                  description={description || undefined}
                  statusLine={
                    row.locked
                      ? badgesDict.lockedStatus
                      : formatUnlocked(row.earnedAt ?? "", badgesDict.unlocked, locale)
                  }
                  imageUrl={row.catalog?.imageUrl ?? null}
                  locked={row.locked}
                  progress={row.progress}
                  progressDetail={progressDetail}
                  progressAriaLabel={badgesDict.progressAria.replace("{title}", title)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
