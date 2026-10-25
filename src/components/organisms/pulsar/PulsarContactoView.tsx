import { CheckCircle2, Mail } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

export interface PulsarContactoViewProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarContactoView({ locale, dict }: PulsarContactoViewProps) {
  const copy = dict.pulsar.contact;
  const checks = [copy.check1, copy.check2, copy.check3];

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="contact">
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-xs font-bold tracking-widest text-[var(--color-primary)] uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.lead}
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {copy.emailLabel}
              </p>
              <p className="mt-2 text-lg font-bold text-[var(--color-foreground)]">
                {copy.emailValue}
              </p>
              <div className="mt-6">
                <a
                  href={`mailto:${copy.emailValue}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  <span>{copy.emailCta}</span>
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[var(--color-foreground)]">
                {copy.checklistTitle}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted-foreground)]">
                {checks.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
