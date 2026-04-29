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
  adminNav,
}: AdminBadgesListScreenProps) {
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

  const baseHref = `/${locale}/dashboard/admin/badges`;
  const filterRegionLabel =
    categoryTab === "all"
      ? `${labels.title} — ${labels.categoryAll}`
      : `${labels.title} — ${adminBadgeCategoryLabel(categoryTab, labels)}`;

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
        <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <UnderlineTabBar
            idPrefix={idPrefix}
            ariaLabel={labels.filterCategoryTablistAria}
            items={tabItems}
            value={categoryTab}
            onChange={(id) => setCategoryTab(id as AdminBadgeCategoryFilterTabId)}
            layout="gridTwoRow"
          />

          <section aria-label={filterRegionLabel} className="outline-none">
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
                    {filteredRows.map((row) => (
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
          </section>
        </div>
      )}
    </div>
  );
}
