"use client";

import Link from "next/link";
import Image from "next/image";
import { useId, useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  GraduationCap,
  LayoutGrid,
  ListTodo,
  MessageCircle,
  Pencil,
  Plus,
  UserCircle,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BadgeCategory, BadgeCriteriaType } from "@/lib/badges/badgeCatalog";
import { UnderlineTabBar, type UnderlineTabItem } from "@/components/molecules/UnderlineTabBar";
import {
  adminBadgeCategoryLabel,
  adminBadgeCriteriaLabel,
} from "@/components/dashboard/admin/badges/adminBadgeListCopy";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";

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

export type AdminBadgeCategoryFilterTabId = "all" | BadgeCategory;

export interface AdminBadgesListScreenProps {
  locale: string;
  rows: AdminBadgeRow[];
  labels: AdminBadgesDict;
  adminNav: Dictionary["dashboard"]["adminNav"];
}

export function AdminBadgesListScreen({
  locale,
  rows,
  labels,
  adminNav: _adminNav,}: AdminBadgesListScreenProps) {
  const idPrefix = useId().replace(/:/g, "");
  const [categoryTab, setCategoryTab] = useState<AdminBadgeCategoryFilterTabId>("all");

  const tabItems: UnderlineTabItem[] = useMemo(
    () => [
      { id: "all", label: labels.categoryAll, Icon: LayoutGrid },
      { id: "tasks", label: adminBadgeCategoryLabel("tasks", labels), Icon: ListTodo },
      {
        id: "attendance",
        label: adminBadgeCategoryLabel("attendance", labels),
        Icon: CalendarDays,
      },
      { id: "profile", label: adminBadgeCategoryLabel("profile", labels), Icon: UserCircle },
      {
        id: "learning",
        label: adminBadgeCategoryLabel("learning", labels),
        Icon: GraduationCap,
      },
      {
        id: "community",
        label: adminBadgeCategoryLabel("community", labels),
        Icon: MessageCircle,
      },
    ],
    [labels],
  );

  const filteredRows = useMemo(() => {
    if (categoryTab === "all") return rows;
    return rows.filter((r) => r.category === categoryTab);
  }, [rows, categoryTab]);

  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    filteredRows,
    {
      image: (r) => r.imageUrl ?? "",
      code: (r) => r.code,
      title: (r) => r.titleEn,
      category: (r) => r.category,
      criteria: (r) => r.criteriaType,
      threshold: (r) => r.criteriaThreshold,
      status: (r) => (r.isActive ? 1 : 0),
    },
    "code",
  );

  const baseHref = `/${locale}/dashboard/admin/badges`;
  const filterRegionLabel =
    categoryTab === "all"
      ? `${labels.title} — ${labels.categoryAll}`
      : `${labels.title} — ${adminBadgeCategoryLabel(categoryTab, labels)}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={labels.title}
        lead={labels.lead}
        iconId="badges"
        tourAnchor={ADMIN_TOUR_ANCHORS.badgesHeader}
        actions={
          <Link
            href={`${baseHref}/new`}
            data-tour={ADMIN_TOUR_ANCHORS.badgesCreateCta}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {labels.createCta}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)] shadow-[var(--shadow-soft)]"
          role="status"
        >
          {labels.empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
          <div data-tour={ADMIN_TOUR_ANCHORS.badgesCategoryTabs}>
            <UnderlineTabBar
              idPrefix={idPrefix}
              ariaLabel={labels.filterCategoryTablistAria}
              items={tabItems}
              value={categoryTab}
              onChange={(id) => setCategoryTab(id as AdminBadgeCategoryFilterTabId)}
              layout="gridTwoRow"
            />
          </div>

          <section
            aria-label={filterRegionLabel}
            data-tour={ADMIN_TOUR_ANCHORS.badgesTable}
            className="outline-none"
          >
            {filteredRows.length === 0 ? (
              <p
                className="px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
                role="status"
              >
                {labels.emptyCategoryFilter}
              </p>
            ) : (
              <div className="overflow-x-auto border-t border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-muted)] text-left">
                    <tr>
                      <SortableTh columnId="image" label={labels.colImage} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <SortableTh columnId="code" label={labels.colCode} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <SortableTh columnId="title" label={labels.colTitle} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <SortableTh columnId="category" label={labels.colCategory} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <SortableTh columnId="criteria" label={labels.colCriteria} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <SortableTh columnId="threshold" label={labels.colThreshold} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <SortableTh columnId="status" label={labels.colStatus} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="p-3 font-medium" />
                      <th scope="col" className="p-3 font-medium">
                        <span className="sr-only">{labels.colActions}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => (
                      <tr key={row.id} className="border-t border-[var(--color-border)]">
                        <td className="p-3">
                          {row.imageUrl ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[var(--color-muted)]">
                              <Image
                                src={row.imageUrl}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
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
                          {adminBadgeCategoryLabel(row.category, labels)}
                        </td>
                        <td className="p-3 text-[var(--color-muted-foreground)]">
                          {adminBadgeCriteriaLabel(row.criteriaType, labels)}
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
                            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
          </section>
        </div>
      )}
    </div>
  );
}
