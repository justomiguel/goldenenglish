import Image from "next/image";
import { Award } from "lucide-react";
import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import type { StudentBadgeRowModel } from "@/components/student/StudentBadgesScreen";
import type { Dictionary } from "@/types/i18n";
import { resolveBadgeTranslation, type BadgeCategory } from "@/lib/badges/badgeCatalog";
import { studentBadgeCategory } from "@/lib/badges/badgeCategory";

type BadgesDict = Dictionary["dashboard"]["student"]["badges"];
type Defs = BadgesDict["definitions"];

function categoryLabelFor(d: BadgesDict, category: BadgeCategory): string {
  if (category === "tasks") return d.categoryTasks;
  if (category === "attendance") return d.categoryAttendance;
  if (category === "profile") return d.categoryProfile;
  return d.categoryLearning;
}

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
}

export function ParentBadgesScreen({
  locale,
  rows,
  wardOptions,
  selectedStudentId,
  parentLabels,
  badgesDict,
}: ParentBadgesScreenProps) {
  const basePath = `/${locale}/dashboard/parent/badges`;
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {parentLabels.badgesPageKicker}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {parentLabels.badgesPageTitle}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {parentLabels.badgesPageLead}
        </p>
      </header>

      <ParentWardPicker
        options={wardOptions}
        selectedStudentId={selectedStudentId}
        label={parentLabels.wardPickerLabel}
        hint={parentLabels.wardPickerHint}
        basePath={basePath}
      />

      {rows.length === 0 ? (
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
            const imageUrl = row.catalog?.imageUrl ?? null;
            return (
              <li
                key={row.id}
                className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-muted)]"
                    aria-hidden
                  >
                    {imageUrl ? (
                      <Image src={imageUrl} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <Award className="h-5 w-5 text-[var(--color-foreground)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                      {categoryLabelFor(badgesDict, category)}
                    </p>
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                      {title}
                    </h2>
                    {description ? (
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                        {description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                      {formatUnlocked(row.earnedAt, badgesDict.unlocked, locale)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
