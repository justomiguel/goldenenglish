"use client";

import type { ReactNode } from "react";
import { useAppSurface } from "@/hooks/useAppSurface";

export type ResponsiveMobileRole = "title" | "subtitle" | "field" | "badge" | "actions";

export interface ResponsiveDataColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  mobileRole?: ResponsiveMobileRole;
  thClassName?: string;
  tdClassName?: string;
}

interface ResponsiveDataTableProps<T> {
  rows: readonly T[];
  columns: readonly ResponsiveDataColumn<T>[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  /** Desktop table classes. Include min-width here; phones never render this table. */
  tableClassName?: string;
  caption?: string;
}

function roleOf<T>(column: ResponsiveDataColumn<T>, index: number, total: number): ResponsiveMobileRole {
  if (column.mobileRole) return column.mobileRole;
  if (index === 0) return "title";
  if (index === total - 1 && column.id === "actions") return "actions";
  return "field";
}

export function ResponsiveDataCard<T>({
  row,
  columns,
}: {
  row: T;
  columns: readonly ResponsiveDataColumn<T>[];
}) {
  const titled = columns.map((column, index) => ({
    column,
    role: roleOf(column, index, columns.length),
  }));
  const titles = titled.filter((item) => item.role === "title");
  const subtitles = titled.filter((item) => item.role === "subtitle");
  const badges = titled.filter((item) => item.role === "badge");
  const fields = titled.filter((item) => item.role === "field");
  const actions = titled.filter((item) => item.role === "actions");

  return (
    <article className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          {titles.map((item) => (
            <div key={item.column.id} className="text-base font-semibold text-[var(--color-foreground)]">
              {item.column.cell(row)}
            </div>
          ))}
          {subtitles.map((item) => (
            <div key={item.column.id} className="text-sm text-[var(--color-muted-foreground)]">
              {item.column.cell(row)}
            </div>
          ))}
        </div>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((item) => (
              <div key={item.column.id}>{item.column.cell(row)}</div>
            ))}
          </div>
        ) : null}
      </div>
      {fields.length > 0 ? (
        <dl className="space-y-2">
          {fields.map((item) => (
            <div key={item.column.id} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(7rem,40%)_1fr] sm:gap-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {item.column.header}
              </dt>
              <dd className="min-w-0 break-words text-sm text-[var(--color-foreground)]">
                {item.column.cell(row)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3 [&>*]:min-h-11">
          {actions.map((item) => (
            <div key={item.column.id} className="flex flex-wrap gap-2">
              {item.column.cell(row)}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/** Table at desktop widths. Labeled cards below the `md` breakpoint. */
export function ResponsiveDataTable<T>({
  rows,
  columns,
  rowKey,
  empty,
  tableClassName = "w-full text-left text-sm",
  caption,
}: ResponsiveDataTableProps<T>) {
  const narrow = useAppSurface() !== "web-desktop";

  if (rows.length === 0 && empty) {
    return <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6">{empty}</div>;
  }

  if (narrow) {
    return (
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={rowKey(row)}>
            <ResponsiveDataCard row={row} columns={columns} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      data-allow-x-scroll
      className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]"
    >
      <table className={tableClassName}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={column.thClassName ?? "px-3 py-2 text-left text-sm font-semibold"}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-[var(--color-border)] last:border-0">
              {columns.map((column) => (
                <td key={column.id} className={column.tdClassName ?? "px-3 py-2 align-top"}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
