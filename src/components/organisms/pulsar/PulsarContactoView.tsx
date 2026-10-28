import { Mail, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { JsonLdFaqPage } from "@/components/molecules/JsonLdFaqPage";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

export interface PulsarContactoViewProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarContactoView({ locale, dict }: PulsarContactoViewProps) {
  const copy = dict.pulsar.contact;
  const checks = [copy.check1, copy.check2, copy.check3, copy.check4, copy.check5];

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="contact">
      <JsonLdFaqPage items={copy.faqs} />
      <section className="border-b border-[var(--color-border)] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.lead}
          </p>

          <h2 className="mt-16 font-display text-2xl font-medium text-[var(--color-foreground)]">
            {copy.stepsTitle}
          </h2>
          <ol className="mt-6 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {copy.steps.map((item) => (
              <li key={item.step} className="grid gap-3 py-7 md:grid-cols-12">
                <p className="font-display text-sm text-[var(--color-accent)] md:col-span-2">
                  {item.step}
                </p>
                <div className="md:col-span-10">
                  <h3 className="font-display text-xl font-medium text-[var(--color-foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">{copy.emailLabel}</p>
              <p className="mt-1 font-display text-xl text-[var(--color-foreground)]">
                {copy.emailValue}
              </p>
              <a
                href={`mailto:${copy.emailValue}`}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span>{copy.emailCta}</span>
              </a>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">{copy.whatsappLabel}</p>
              <p className="mt-1 font-display text-xl text-[var(--color-foreground)]">
                {copy.whatsappValue}
              </p>
              <a
                href={copy.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span>{copy.whatsappCta}</span>
              </a>
            </div>
          </div>

          <h2 className="mt-16 font-display text-xl font-medium text-[var(--color-foreground)]">
            {copy.checklistTitle}
          </h2>
          <ol className="mt-4 space-y-3">
            {checks.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm text-[var(--color-muted-foreground)]">
                <span className="font-display text-[var(--color-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.faqTitle}
          </h2>
          <div className="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {copy.faqs.map((faq) => (
              <article key={faq.q} className="py-7">
                <h3 className="font-display text-lg font-medium text-[var(--color-foreground)]">
                  {faq.q}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {faq.a}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
