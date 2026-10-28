import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
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
    <div className="cl-surface flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${locale}`} className="inline-flex items-center" aria-label={dict.pulsar.meta.brandName}>
            <CentroListoLogoMark size="md" />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm transition-colors ${
                  activeNav === item.key
                    ? "text-[var(--color-foreground)]"
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
              className="hidden text-xs text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] lg:inline"
            >
              {nav.admin}
            </Link>
            <Link
              href={`/${locale}/contacto`}
              className="hidden min-h-[40px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] lg:inline-flex"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{nav.cta}</span>
            </Link>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--color-border)] px-4 py-3 md:hidden">
          {links.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`min-h-[36px] text-sm ${
                activeNav === item.key
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-border)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <CentroListoLogoMark size="md" />
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {nav.footerTagline}
              </p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                {nav.footerPrivacyBadge}
              </p>
            </div>
            <div className="flex flex-col justify-between gap-6 md:col-span-5 md:items-end">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-muted-foreground)]">
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
                  className="transition-colors hover:text-[var(--color-foreground)]"
                >
                  {nav.admin}
                </Link>
              </div>
              <a
                href={`mailto:${dict.pulsar.contact.emailValue}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span>{dict.pulsar.contact.emailValue}</span>
              </a>
            </div>
          </div>
          <p className="mt-12 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-muted-foreground)]">
            {nav.footerRights}
          </p>
        </div>
      </footer>
    </div>
  );
}
