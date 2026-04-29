import Image from "next/image";
import { Award } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  resolveBadgeTranslation,
  type BadgeCategory,
  type BadgeTranslation,
} from "@/lib/badges/badgeCatalog";
import { studentBadgeCategory } from "@/lib/badges/badgeCategory";
import { StudentBadgeShareControls } from "@/components/student/StudentBadgeShareControls";

export type StudentBadgeRowModel = {
  id: string;
  badgeCode: string;
  earnedAt: string;
  shareUrl: string;
  /** When set, takes precedence over the dictionary fallback. */
  catalog?: {
    category: BadgeCategory;
    imageUrl: string | null;
    translations: Partial<Record<"en" | "es", BadgeTranslation>>;
  };
};

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
  locale: string;
  rows: StudentBadgeRowModel[];
  dict: BadgesDict;
}

export function StudentBadgesScreen({ locale, rows, dict }: StudentBadgesScreenProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {dict.kicker}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{dict.title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.howItWorks}</p>
      </header>

      {rows.length === 0 ? (
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
            const shareLabels = {
              copyLink: dict.copyLink,
              share: dict.share,
              linkCopied: dict.linkCopied,
              copyFailed: dict.copyFailed,
            };
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
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <Award className="h-5 w-5 text-[var(--color-foreground)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                      {categoryLabelFor(dict, category)}
                    </p>
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h2>
                    {description ? (
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                      {formatUnlocked(row.earnedAt, dict.unlocked, locale)}
                    </p>
                  </div>
                </div>
                <StudentBadgeShareControls
                  shareUrl={row.shareUrl}
                  labels={shareLabels}
                  badgeCode={row.badgeCode}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
