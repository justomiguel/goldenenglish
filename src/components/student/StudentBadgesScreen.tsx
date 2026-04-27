import { Award } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { StudentBadgeCode } from "@/lib/badges/badgeCodes";
import { studentBadgeCategory } from "@/lib/badges/badgeCategory";
import { StudentBadgeShareControls } from "@/components/student/StudentBadgeShareControls";

export type StudentBadgeRowModel = {
  id: string;
  badgeCode: StudentBadgeCode;
  earnedAt: string;
  shareUrl: string;
};

type BadgesDict = Dictionary["dashboard"]["student"]["badges"];
type Defs = BadgesDict["definitions"];

function categoryLabel(
  d: BadgesDict,
  code: StudentBadgeCode,
): string {
  const cat = studentBadgeCategory(code);
  if (cat === "tasks") return d.categoryTasks;
  if (cat === "attendance") return d.categoryAttendance;
  if (cat === "profile") return d.categoryProfile;
  return d.categoryLearning;
}

function titleDesc(defs: Defs, code: StudentBadgeCode): { title: string; description: string } {
  const entry = defs[code as keyof Defs];
  if (entry && typeof entry === "object" && "title" in entry) {
    return { title: String(entry.title), description: String(entry.description) };
  }
  return { title: code, description: "" };
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
            const { title, description } = titleDesc(dict.definitions, row.badgeCode);
            const shareLabels = { copyLink: dict.copyLink, share: dict.share, linkCopied: dict.linkCopied, copyFailed: dict.copyFailed };
            return (
              <li
                key={row.id}
                className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]"
                    aria-hidden
                  >
                    <Award className="h-5 w-5 text-[var(--color-foreground)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                      {categoryLabel(dict, row.badgeCode)}
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
                <StudentBadgeShareControls shareUrl={row.shareUrl} labels={shareLabels} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
