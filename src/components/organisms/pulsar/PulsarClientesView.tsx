import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarClientInstituteMark } from "@/components/organisms/pulsar/PulsarClientInstituteMark";
import { PulsarClientPreviewCard } from "@/components/organisms/pulsar/PulsarClientPreviewCard";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

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
}

function clientHref(client: PulsarClientSummary): string | null {
  return client.publicUrl ?? (client.hosts[0] ? `https://${client.hosts[0]}` : null);
}

export function PulsarClientesView({
  locale,
  dict,
  clients,
}: PulsarClientesViewProps) {
  const copy = dict.pulsar.clients;
  const withMedia = clients.filter(
    (client) => client.previewVideoSrc || client.previewPosterSrc,
  );
  const withoutMedia = clients.filter(
    (client) => !client.previewVideoSrc && !client.previewPosterSrc,
  );

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="clients">
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

          {withMedia.length > 0 ? (
            <ul className="mt-14 grid gap-10 md:grid-cols-2">
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
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}

          {withoutMedia.length > 0 ? (
            <ol className="mt-14 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {withoutMedia.map((client, index) => {
                const href = clientHref(client);
                return (
                  <li key={client.slug} className="grid gap-3 py-7 md:grid-cols-12 md:items-center">
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
                          className="inline-flex min-h-[40px] items-center gap-2 text-sm text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
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

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
            {copy.verticalsEyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.verticalsTitle}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.verticalsLead}
          </p>

          <ol className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {copy.verticals.map((vertical, index) => (
              <li key={vertical.title} className="border-t border-[var(--color-border)] pt-6">
                <p className="font-display text-sm text-[var(--color-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-xl font-medium text-[var(--color-foreground)]">
                  {vertical.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {vertical.body}
                </p>
                <p className="mt-3 text-sm text-[var(--color-foreground)]">{vertical.highlight}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14">
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
