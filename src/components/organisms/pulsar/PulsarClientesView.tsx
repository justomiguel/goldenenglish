import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarClientInstituteMark } from "@/components/organisms/pulsar/PulsarClientInstituteMark";
import { PulsarClientPreviewCard } from "@/components/organisms/pulsar/PulsarClientPreviewCard";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import { PulsarVoiceCarousel } from "@/components/organisms/pulsar/PulsarVoiceCarousel";

export interface PulsarClientSummary {
  slug: string;
  displayName: string;
  hosts: string[];
  publicUrl: string | null;
  previewVideoSrc?: string;
  previewPosterSrc?: string;
  logoSrc?: string;
}

export interface PulsarClientesViewProps {
  locale: string;
  dict: Dictionary;
  clients: readonly PulsarClientSummary[];
  email?: string | null;
}

function clientHref(client: PulsarClientSummary): string | null {
  return client.publicUrl ?? (client.hosts[0] ? `https://${client.hosts[0]}` : null);
}

export function PulsarClientesView({
  locale,
  dict,
  clients,
  email = null,
}: PulsarClientesViewProps) {
  const copy = dict.pulsar.clients;
  const withMedia = clients.filter(
    (client) => client.previewVideoSrc || client.previewPosterSrc,
  );
  const withoutMedia = clients.filter(
    (client) => !client.previewVideoSrc && !client.previewPosterSrc,
  );
  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} activeNav="clients">
      <section className="border-b border-[var(--color-border)] py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="max-w-2xl font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            {copy.title}
          </h1>

          {withMedia.length > 0 ? (
            <ul className="mt-10 grid gap-10 md:grid-cols-2">
              {withMedia.map((client) => {
                const href = clientHref(client);
                if (!href) return null;
                return (
                  <li key={client.slug}>
                    <PulsarClientPreviewCard
                      displayName={client.displayName}
                      href={href}
                      visitText={copy.visitSite}
                      visitLabel={copy.visitSiteNamed.replace("{name}", client.displayName)}
                      previewVideoSrc={client.previewVideoSrc}
                      previewPosterSrc={client.previewPosterSrc}
                      logoSrc={client.logoSrc}
                      deferVideo
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}

          {withoutMedia.length > 0 ? (
            <ol className="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {withoutMedia.map((client, index) => {
                const href = clientHref(client);
                return (
                  <li key={client.slug} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
                    <p className="font-display text-sm text-[var(--color-accent)] md:col-span-2">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <div className="md:col-span-7">
                      <div className="flex items-center gap-5">
                        {client.logoSrc ? (
                          <PulsarClientInstituteMark src={client.logoSrc} />
                        ) : null}
                        <h2 className="font-display text-xl font-medium text-[var(--color-foreground)]">
                          {client.displayName}
                        </h2>
                      </div>
                    </div>
                    {href ? (
                      <div className="md:col-span-3 md:text-right">
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          <span>{copy.visitSite}</span>
                        </a>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </section>

      <PulsarVoiceCarousel dict={dict} />
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Link
          href={`/${locale}/contacto`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          <span>{dict.pulsar.nav.cta}</span>
        </Link>
      </div>
    </PulsarSiteChromeEntry>
  );
}
