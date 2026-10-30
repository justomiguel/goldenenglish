"use client";

import Link from "next/link";
import { ArrowRight, Home, LayoutDashboard, MessageCircle, School, Waypoints } from "lucide-react";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import type { PulsarSiteChromeProps } from "@/components/organisms/pulsar/PulsarSiteChrome";

const NAV = [
  { key: "home" as const, href: (locale: string) => `/${locale}`, icon: Home },
  { key: "product" as const, href: (locale: string) => `/${locale}/producto`, icon: Waypoints },
  { key: "clients" as const, href: (locale: string) => `/${locale}/clientes`, icon: School },
  { key: "contact" as const, href: (locale: string) => `/${locale}/contacto`, icon: MessageCircle },
];

export function PulsarSiteChromePwa({
  locale,
  dict,
  email = null,
  activeNav = "home",
  children,
}: PulsarSiteChromeProps) {
  const nav = dict.pulsar.nav;
  const labels = {
    home: nav.home,
    product: nav.product,
    clients: nav.clients,
    contact: nav.contact,
  };
  const showThumb = activeNav !== "contact";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/92 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex min-h-14 items-center justify-between gap-2 px-4">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={dict.pulsar.meta.brandName}>
            <CentroListoLogoMark size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={`/${locale}/admin`}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] px-3 text-sm font-semibold text-[var(--color-foreground)]"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              <span>{nav.admin}</span>
            </Link>
            <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />
          </div>
        </div>
      </header>

      <main className={showThumb ? "flex-1 pb-32" : "flex-1 pb-24"}>{children}</main>

      <nav
        aria-label={dict.pulsar.session.navAria}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {showThumb ? (
          <Link
            href={`/${locale}/contacto`}
            className="flex min-h-12 items-center justify-between gap-3 bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <span>{nav.cta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const current = activeNav === item.key;
            return (
              <li key={item.key}>
                <Link
                  href={item.href(locale)}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 px-1 text-[11px] ${
                    current
                      ? "border-[var(--color-primary)] text-[var(--color-foreground)]"
                      : "border-transparent text-[var(--color-muted-foreground)]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {labels[item.key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
