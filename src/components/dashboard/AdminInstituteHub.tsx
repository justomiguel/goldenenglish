import Link from "next/link";
import { adminSurfaceIcon } from "@/lib/dashboard/adminSurfaceIcon";
import type { AdminInstituteHubGroup } from "@/lib/dashboard/buildAdminInstituteHubGroups";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export function AdminInstituteHub({
  title,
  lead,
  groups,
}: {
  title: string;
  lead: string;
  groups: AdminInstituteHubGroup[];
}) {
  return (
    <div data-tour="admin-institute-hub">
      <AdminPageHeader title={title} lead={lead} iconId="institute" />
      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`institute-${group.id}`}>
            <h2
              id={`institute-${group.id}`}
              className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]"
            >
              {group.label}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.rows.map((row) => (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    title={row.tip}
                    className="flex h-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition hover:shadow-md"
                  >
                    <span
                      aria-hidden
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]"
                    >
                      {adminSurfaceIcon(row.iconId, "h-7 w-7")}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base font-semibold text-[var(--color-foreground)]">
                        {row.label}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">
                        {row.tip}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
