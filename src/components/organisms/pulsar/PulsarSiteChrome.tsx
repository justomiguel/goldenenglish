import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface PulsarSiteChromeProps {
  locale: string;
  dict: Dictionary;
  activeNav?: "home" | "product" | "clients" | "contact";
  children: React.ReactNode;
}

export function PulsarSiteChrome({
  locale,
  dict,
  activeNav = "home",
  children,
}: PulsarSiteChromeProps) {
  const nav = dict.pulsar.nav;
  const links = [
    { key: "home" as const, href: `/${locale}`, label: nav.home },
    { key: "product" as const, href: `/${locale}/producto`, label: nav.product },
    { key: "clients" as const, href: `/${locale}/clientes`, label: nav.clients },
    { key: "contact" as const, href: `/${locale}/contacto`, label: nav.contact },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--color-foreground)]"
          >
            <Layers className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <span>{dict.pulsar.meta.brandName}</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  activeNav === item.key
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin`}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <span>{nav.admin}</span>
            </Link>
            <Link
              href={`/${locale}/contacto`}
              className="hidden min-h-[40px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] sm:inline-flex"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{nav.cta}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[var(--color-muted-foreground)] sm:flex-row sm:px-6">
          <p>{nav.footerRights}</p>
          <div className="flex flex-wrap items-center gap-4">
            {links.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="transition-colors hover:text-[var(--color-foreground)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/admin`}
              className="font-semibold text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
            >
              {nav.admin}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
