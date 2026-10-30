"use client";

import type { ComponentProps, ReactNode } from "react";
import { ChartNoAxesColumn, FileText, Settings } from "lucide-react";
import { BlogAdminListShell } from "@/components/dashboard/admin/cms/blog/BlogAdminListShell";
import { BlogConfigForm } from "@/components/dashboard/admin/cms/blog/BlogConfigForm";
import { BlogStatsPanel } from "@/components/dashboard/admin/cms/blog/BlogStatsPanel";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import type { BlogArticleListItem } from "@/lib/blog/server";
import type { Dictionary } from "@/types/i18n";

type HubTab = "articles" | "config" | "stats";

interface BlogHubProps {
  locale: string;
  canConfigure: boolean;
  rows: BlogArticleListItem[];
  canDelete: boolean;
  listLabels: Dictionary["admin"]["cms"]["blog"]["list"];
  hubLabels: Dictionary["admin"]["cms"]["blog"]["hub"];
  config: {
    blogEnabled: boolean;
    commentsEnabled: boolean;
    guestCommentsEnabled: boolean;
    labels: Dictionary["admin"]["cms"]["blog"]["config"];
  } | null;
  stats: ComponentProps<typeof BlogStatsPanel> | null;
}

export function BlogHub({
  locale,
  canConfigure,
  rows,
  canDelete,
  listLabels,
  hubLabels,
  config,
  stats,
}: BlogHubProps) {
  const allowed: HubTab[] = canConfigure ? ["articles", "config", "stats"] : ["articles"];
  const { value, setValue } = usePersistentPageTab<HubTab>({
    allowed,
    fallback: "articles",
  });

  return (
    <div className="grid gap-6">
      {canConfigure ? (
        <div className="flex flex-wrap gap-2" role="tablist">
          <TabButton active={value === "articles"} onClick={() => setValue("articles")} icon={<FileText aria-hidden className="h-4 w-4" />}>
            {hubLabels.articles}
          </TabButton>
          <TabButton active={value === "config"} onClick={() => setValue("config")} icon={<Settings aria-hidden className="h-4 w-4" />}>
            {hubLabels.config}
          </TabButton>
          <TabButton active={value === "stats"} onClick={() => setValue("stats")} icon={<ChartNoAxesColumn aria-hidden className="h-4 w-4" />}>
            {hubLabels.stats}
          </TabButton>
        </div>
      ) : null}

      {value === "articles" ? (
        <BlogAdminListShell locale={locale} rows={rows} canDelete={canDelete} labels={listLabels} />
      ) : null}
      {value === "config" && config ? (
        <BlogConfigForm locale={locale} {...config} />
      ) : null}
      {value === "stats" && stats ? <BlogStatsPanel {...stats} /> : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`inline-flex min-h-[36px] items-center gap-2 rounded-md px-3 text-sm ${active ? "bg-[var(--color-muted)] text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
