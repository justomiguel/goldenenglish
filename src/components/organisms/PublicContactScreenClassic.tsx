import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";

export interface PublicContactScreenClassicProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
}

export function PublicContactScreenClassic({ locale, dict, brand }: PublicContactScreenClassicProps) {
  const prefix = `/${locale}`;
  const pc = dict.publicContact;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(55vh,520px)] -z-10 bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,color-mix(in_srgb,var(--color-accent)_16%,transparent)_0%,transparent_65%)] opacity-90"
        aria-hidden
      />
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} />

      <div className="mx-auto max-w-2xl pt-10">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)] md:text-4xl">
            {pc.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted-foreground)] md:text-lg">
            {pc.lead}
          </p>
        </header>
        <div className="mt-10 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
          <PublicContactForm locale={locale} labels={pc} />
        </div>
        <p className="mt-8 text-center text-sm">
          <Link
            href={`${prefix}/login`}
            className="inline-flex min-h-[44px] items-center gap-2 text-[var(--color-primary)] underline decoration-[var(--color-primary)]/35 underline-offset-2 transition hover:decoration-[var(--color-primary)]"
          >
            <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
            {dict.login.title}
          </Link>
        </p>
      </div>
    </div>
  );
}
