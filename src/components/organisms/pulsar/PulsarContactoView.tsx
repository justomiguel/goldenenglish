import Image from "next/image";
import { ChevronDown, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { JsonLdFaqPage } from "@/components/molecules/JsonLdFaqPage";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { PulsarContactSteps } from "@/components/organisms/pulsar/PulsarContactSteps";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";

export interface PulsarContactoViewProps {
  locale: string;
  dict: Dictionary;
  email?: string | null;
}

const CONTACT_STILL = "/centrolisto/moments/sunday.webp";

export function PulsarContactoView({ locale, dict, email = null }: PulsarContactoViewProps) {
  const copy = dict.pulsar.contact;
  const checks = [copy.check1, copy.check2, copy.check3, copy.check4, copy.check5];

  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} activeNav="contact">
      <JsonLdFaqPage items={copy.faqs} />
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-12 lg:py-16">
          <div className="lg:col-start-1 lg:row-start-1">
            <h1 className="max-w-xl font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--color-muted-foreground)]">
              {copy.lead}
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
            <figure className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={CONTACT_STILL}
                alt={dict.pulsar.home.heroImageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </figure>
            <a
              href={copy.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <span>{copy.whatsappCta}</span>
            </a>
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <PublicContactForm locale={locale} labels={dict.publicContact} embedded />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] py-10 md:py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <PulsarContactSteps title={copy.stepsTitle} steps={copy.steps} />
          <div>
            <h2 className="font-display text-2xl font-medium text-[var(--color-foreground)]">
              {copy.checklistTitle}
            </h2>
            <ol className="mt-6 space-y-3">
              {checks.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm text-[var(--color-foreground)]">
                  <span className="font-display text-[var(--color-accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.faqTitle}
          </h2>
          <div className="mt-6 border-t border-[var(--color-border)]">
            {copy.faqs.map((faq) => (
              <details key={faq.q} className="group border-b border-[var(--color-border)]">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-medium text-[var(--color-foreground)]">
                  <span>{faq.q}</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PulsarSiteChromeEntry>
  );
}
