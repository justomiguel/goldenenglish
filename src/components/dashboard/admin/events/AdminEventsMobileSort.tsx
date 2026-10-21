"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EventSortKey } from "@/lib/dashboard/events/loadPaginatedAdminEvents";

const SORT_OPTIONS: { key: EventSortKey; labelKey: "date" | "title" | "status" | "capacity" | "views" | "price" }[] =
  [
    { key: "event_date", labelKey: "date" },
    { key: "title", labelKey: "title" },
    { key: "status", labelKey: "status" },
    { key: "attendees_count", labelKey: "capacity" },
    { key: "views", labelKey: "views" },
    { key: "price", labelKey: "price" },
  ];

interface AdminEventsMobileSortProps {
  sort: EventSortKey;
  dir: "asc" | "desc";
  labels: Record<(typeof SORT_OPTIONS)[number]["labelKey"], string>;
}

export function AdminEventsMobileSort({ sort, dir, labels }: AdminEventsMobileSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="md:hidden">
      <span className="sr-only">{labels.title}</span>
      <select
        className="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-xs font-medium text-[var(--color-foreground)]"
        value={`${sort}:${dir}`}
        onChange={(event) => {
          const [key, nextDir] = event.target.value.split(":") as [EventSortKey, "asc" | "desc"];
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", key);
          params.set("dir", nextDir);
          params.set("page", "1");
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        {SORT_OPTIONS.flatMap(({ key, labelKey }) => {
          const label = labels[labelKey];
          return [
            <option key={`${key}:asc`} value={`${key}:asc`}>
              {label} ↑
            </option>,
            <option key={`${key}:desc`} value={`${key}:desc`}>
              {label} ↓
            </option>,
          ];
        })}
      </select>
    </label>
  );
}
