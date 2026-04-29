import Link from "next/link";
import Image from "next/image";
import { Award, Pencil, Plus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BadgeCategory, BadgeCriteriaType } from "@/lib/badges/badgeCatalog";

export type AdminBadgeRow = {
  id: string;
  code: string;
  category: BadgeCategory;
  criteriaType: BadgeCriteriaType;
  criteriaThreshold: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  titleEn: string;
};

type AdminBadgesDict = Dictionary["admin"]["badges"];

export interface AdminBadgesListScreenProps {
  locale: string;
  rows: AdminBadgeRow[];
  labels: AdminBadgesDict;
  adminNav: Dictionary["dashboard"]["adminNav"];
}

function categoryLabel(c: BadgeCategory, labels: AdminBadgesDict): string {
  if (c === "tasks") return labels.categoryTasks;
  if (c === "attendance") return labels.categoryAttendance;
  if (c === "profile") return labels.categoryProfile;
  return labels.categoryLearning;
}

function criteriaLabel(c: BadgeCriteriaType, labels: AdminBadgesDict): string {
  if (c === "tasks_completed") return labels.criteriaTasksCompleted;
  if (c === "attendance_streak") return labels.criteriaAttendanceStreak;
  if (c === "profile_complete") return labels.criteriaProfileComplete;
  return labels.criteriaAssessmentsPassed;
}

export function AdminBadgesListScreen({
  locale,
  rows,
  labels,
  adminNav,
}: AdminBadgesListScreenProps) {
  const baseHref = `/${locale}/dashboard/admin/badges`;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {adminNav.breadcrumbAdmin}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.title}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
        </div>
        <Link
          href={`${baseHref}/new`}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {labels.createCta}
        </Link>
      </header>

      {rows.length === 0 ? (
        <p
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {labels.empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-left">
              <tr>
                <th scope="col" className="p-3 font-medium">
                  {labels.colImage}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.colCode}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.colTitle}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.colCategory}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.colCriteria}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.colThreshold}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.colStatus}
                </th>
                <th scope="col" className="p-3 font-medium">
                  <span className="sr-only">{labels.colActions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3">
                    {row.imageUrl ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[var(--color-muted)]">
                        <Image src={row.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)]"
                        aria-hidden
                      >
                        <Award className="h-4 w-4 text-[var(--color-foreground)]" />
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-[var(--color-foreground)]">{row.code}</td>
                  <td className="p-3 text-[var(--color-foreground)]">{row.titleEn}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">
                    {categoryLabel(row.category, labels)}
                  </td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">
                    {criteriaLabel(row.criteriaType, labels)}
                  </td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">
                    {row.criteriaThreshold}
                  </td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">
                    {row.isActive ? labels.statusActive : labels.statusPaused}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`${baseHref}/${row.id}`}
                      className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {labels.editCta}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
