import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Globe,
  Server,
  Smartphone,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

export interface PulsarProductoViewProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarProductoView({ locale, dict }: PulsarProductoViewProps) {
  const copy = dict.pulsar.product;
  const modules = [
    { icon: Globe, title: copy.m1Title, body: copy.m1Body },
    { icon: CalendarCheck, title: copy.m2Title, body: copy.m2Body },
    { icon: BookOpen, title: copy.m3Title, body: copy.m3Body },
    { icon: Smartphone, title: copy.m4Title, body: copy.m4Body },
    { icon: CreditCard, title: copy.m5Title, body: copy.m5Body },
    { icon: Server, title: copy.m6Title, body: copy.m6Body },
  ];

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="product">
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-bold tracking-widest text-[var(--color-primary)] uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--color-muted-foreground)]">
            {copy.lead}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{dict.pulsar.nav.cta}</span>
            </Link>
          </div>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
