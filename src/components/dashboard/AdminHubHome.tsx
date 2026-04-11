import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

interface AdminHubHomeProps {
  locale: string;
  dict: Dictionary;
}

export function AdminHubHome({ locale, dict }: AdminHubHomeProps) {
  const base = `/${locale}/dashboard/admin`;
  const cards: { href: string; title: string; description: string }[] = [
    {
      href: `${base}/import`,
      title: dict.dashboard.adminNav.import,
      description: dict.admin.home.cards.import,
    },
    {
      href: `${base}/users`,
      title: dict.dashboard.adminNav.users,
      description: dict.admin.home.cards.users,
    },
    {
      href: `${base}/payments`,
      title: dict.dashboard.adminNav.payments,
      description: dict.admin.home.cards.payments,
    },
    {
      href: `${base}/registrations`,
      title: dict.dashboard.adminNav.registrations,
      description: dict.admin.home.cards.registrations,
    },
    {
      href: `${base}/settings`,
      title: dict.dashboard.adminNav.settings,
      description: dict.admin.home.cards.settings,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.home.title}
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--color-muted-foreground)]">
        {dict.admin.home.lead}
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 shadow-sm transition hover:bg-[var(--color-muted)]"
            >
              <span className="block font-medium text-[var(--color-primary)]">{c.title}</span>
              <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">
                {c.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
