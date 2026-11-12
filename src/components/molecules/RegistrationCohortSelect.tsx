"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function RegistrationCohortSelect({
  label,
  cohorts,
  value,
}: {
  label: string;
  cohorts: readonly { id: string; name: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(next: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("cohort", next);
    sp.delete("page");
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <label htmlFor="registration-cohort" className="block text-sm text-[var(--color-foreground)]">
      {label}
      <select
        id="registration-cohort"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] focus-visible:ring-2"
      >
        {cohorts.map((cohort) => (
          <option key={cohort.id} value={cohort.id}>
            {cohort.name}
          </option>
        ))}
      </select>
    </label>
  );
}
