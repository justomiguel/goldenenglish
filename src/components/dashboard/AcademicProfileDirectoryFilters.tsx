"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/types/i18n";

type Column = { id: string; label: string; fieldType: string; selectOptions: string[] };
type Labels = Dictionary["admin"]["users"]["academicFields"];

export function AcademicProfileDirectoryFilters({
  columns,
  selectFacets,
  labels,
}: {
  columns: Column[];
  selectFacets: Record<string, Record<string, number>>;
  labels: Labels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (columns.length === 0) return null;

  function setField(id: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim()) next.set(`acf_${id}`, value.trim());
    else next.delete(`acf_${id}`);
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {columns.map((column) => {
        const current = searchParams.get(`acf_${column.id}`) ?? "";
        if (column.fieldType === "select") {
          return (
            <label key={column.id} className="grid gap-1 text-sm">
              <span className="font-medium text-[var(--color-foreground)]">{column.label}</span>
              <select
                className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                value={current}
                aria-label={column.label}
                onChange={(event) => setField(column.id, event.target.value)}
              >
                <option value="">{labels.empty}</option>
                {column.selectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} ({selectFacets[column.id]?.[option] ?? 0})
                  </option>
                ))}
              </select>
            </label>
          );
        }
        const inputType = column.fieldType === "number" ? "number" : column.fieldType === "date" ? "date" : "text";
        return (
          <label key={column.id} className="grid gap-1 text-sm">
            <span className="font-medium text-[var(--color-foreground)]">{column.label}</span>
            <input
              className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              type={inputType}
              defaultValue={current}
              aria-label={column.label}
              onBlur={(event) => {
                if (event.target.value !== current) setField(column.id, event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") setField(column.id, (event.target as HTMLInputElement).value);
              }}
            />
          </label>
        );
      })}
    </div>
  );
}
