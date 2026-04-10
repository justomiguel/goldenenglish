import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface AdminHomeProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminHomePage({ params }: AdminHomeProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const base = `/${locale}/dashboard/admin`;
  const cards = [
    { href: `${base}/import`, label: dict.dashboard.adminNav.import },
    { href: `${base}/users`, label: dict.dashboard.adminNav.users },
    { href: `${base}/payments`, label: dict.dashboard.adminNav.payments },
    { href: `${base}/registrations`, label: dict.dashboard.adminNav.registrations },
    { href: `${base}/settings`, label: dict.dashboard.adminNav.settings },
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
              className="block rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 font-medium text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-muted)]"
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
