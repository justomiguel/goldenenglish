"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/types/i18n";

type Column = { id: string; label: string; fieldType: string; selectOptions: string[] };
type Labels = Dictionary["admin"]["users"]["academicFields"];

const controlClass =
  "min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm";

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
    <>
      {columns.map((column) => {
        const current = searchParams.get(`acf_${column.id}`) ?? "";
        if (column.fieldType === "select") {
          return (
            <label key={column.id} className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted-foreground)]">{column.label}</span>
              <select
                className={controlClass}
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
          <label key={column.id} className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted-foreground)]">{column.label}</span>
            <input
              className={controlClass}
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
    </>
  );
}
