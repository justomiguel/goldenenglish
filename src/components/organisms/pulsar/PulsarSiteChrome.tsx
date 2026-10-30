import Link from "next/link";
import { ArrowRight, LayoutDashboard, MessageCircle } from "lucide-react";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import type { Dictionary } from "@/types/i18n";

export interface PulsarSiteChromeProps {
  locale: string;
  dict: Dictionary;
  email?: string | null;
  activeNav?: "home" | "product" | "clients" | "contact";
  children: React.ReactNode;
}

export function PulsarSiteChrome({
  locale,
  dict,
  email = null,
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
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] px-3 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              <span>{nav.admin}</span>
            </Link>
            <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />
            <Link
              href={`/${locale}/contacto`}
              className="hidden min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] lg:inline-flex"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{nav.cta}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <a
        href={dict.pulsar.contact.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={dict.pulsar.home.whatsappCta}
        title={dict.pulsar.home.whatsappCta}
        className="fixed left-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] bottom-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
      </a>

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
