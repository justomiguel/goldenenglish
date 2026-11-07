import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { CentrolistoMarketPicker } from "@/components/organisms/pulsar/CentrolistoMarketPicker";
import { PulsarSegmentNav } from "@/components/organisms/pulsar/PulsarSegmentNav";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import { PulsarSolutionNav } from "@/components/organisms/pulsar/PulsarSolutionNav";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { pulsarStartFreePath } from "@/lib/pulsar/pulsarStartPath";
import { PULSAR_SOLUTION_SLUGS, type PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";
import type { Dictionary } from "@/types/i18n";

export interface PulsarSiteChromeProps {
  locale: string;
  dict: Dictionary;
  email?: string | null;
  market?: CentrolistoMarketCode;
  activeNav?: "home" | "product" | "clients" | "contact" | "pricing" | "account" | PulsarSolutionSlug;
  children: React.ReactNode;
}

export function PulsarSiteChrome({
  locale,
  dict,
  email = null,
  market = "cl",
  activeNav = "home",
  children,
}: PulsarSiteChromeProps) {
  const nav = dict.pulsar.nav;
  const href = (path: string) => withCentrolistoMarket(path, market);
  const links = [
    { key: "home" as const, href: href(`/${locale}`), label: nav.home },
    ...PULSAR_SOLUTION_SLUGS.map((slug) => ({
      key: slug,
      href: href(`/${locale}/soluciones/${slug}`),
      label: dict.pulsar.solutionSet[slug].navLabel,
    })),
    { key: "pricing" as const, href: href(`/${locale}/precios`), label: nav.pricing },
    { key: "product" as const, href: href(`/${locale}/producto`), label: nav.product },
    { key: "clients" as const, href: href(`/${locale}/clientes`), label: nav.clients },
    { key: "contact" as const, href: href(`/${locale}/contacto`), label: nav.contact },
  ];

  return (
    <div className="cl-surface flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl flex-nowrap items-center gap-3 px-4 sm:px-6">
          <Link href={href(`/${locale}`)} className="inline-flex shrink-0 items-center" aria-label={dict.pulsar.meta.brandName}>
            <CentroListoLogoMark size="md" />
          </Link>
          <CentrolistoMarketPicker market={market} copy={dict.pulsar.market} />
          <nav className="hidden min-w-0 flex-1 items-center gap-x-3 overflow-x-auto whitespace-nowrap [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
            {links.map((item) => {
              const current = activeNav === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`shrink-0 rounded-[var(--layout-border-radius)] px-2 py-1 text-sm whitespace-nowrap transition-colors ${
                    current
                      ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {email ? null : <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />}
            <Link
              href={href(pulsarStartFreePath(locale, Boolean(email)))}
              className="hidden min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] lg:inline-flex"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{email ? nav.enterPanel : nav.startFree}</span>
            </Link>
            {email ? <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} /> : null}
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
            <div className="md:col-span-5">
              <CentroListoLogoMark size="md" />
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {nav.footerTagline}
              </p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                {nav.footerPrivacyBadge}
              </p>
            </div>
            <div className="md:col-span-3">
              <PulsarSolutionNav locale={locale} dict={dict} market={market} />
              <div className="mt-8">
                <PulsarSegmentNav locale={locale} dict={dict} market={market} />
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 md:col-span-4 md:items-end">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-muted-foreground)]">
                {links.filter((item) => item.key === "home" || item.key === "pricing" || item.key === "product" || item.key === "clients" || item.key === "contact").map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="transition-colors hover:text-[var(--color-foreground)]"
                  >
                    {item.label}
                  </Link>
                ))}
                {email ? (
                  <Link
                    href={href(`/${locale}/cuenta`)}
                    className="transition-colors hover:text-[var(--color-foreground)]"
                  >
                    {nav.admin}
                  </Link>
                ) : null}
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
