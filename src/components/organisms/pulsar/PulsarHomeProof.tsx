import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarClientPreviewCard } from "@/components/organisms/pulsar/PulsarClientPreviewCard";
import type { PulsarClientSummary } from "@/components/organisms/pulsar/PulsarClientesView";

export interface PulsarHomeProofProps {
  locale: string;
  dict: Dictionary;
  activeTenantCount: number;
  featuredClients: readonly PulsarClientSummary[];
  logoClients: readonly PulsarClientSummary[];
}

function clientHref(client: PulsarClientSummary): string | null {
  return client.publicUrl ?? (client.hosts[0] ? `https://${client.hosts[0]}` : null);
}

export function PulsarHomeProof({
  locale,
  dict,
  activeTenantCount,
  featuredClients,
  logoClients,
}: PulsarHomeProofProps) {
  const copy = dict.pulsar.home;
  const cards = featuredClients.flatMap((client) => {
    const href = clientHref(client);
    if (!href) return [];
    return [{ client, href }];
  });

  return (
    <section className="border-b border-[var(--color-border)] py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          <strong className="font-semibold text-[var(--color-foreground)]">{activeTenantCount}</strong>{" "}
          {copy.stats.tenantsLabel}
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.schoolsTitle}
        </h2>
        {logoClients.length > 0 ? (
          <ul className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6">
            {logoClients.map((client) => {
              const href = clientHref(client);
              const mark = client.logoSrc ? (
                <Image
                  src={client.logoSrc}
                  alt=""
                  width={160}
                  height={64}
                  className="h-14 w-auto max-w-[9.5rem] object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-[var(--color-foreground)]">{client.displayName}</span>
              );
              return (
                <li key={client.slug}>
                  {href ? (
                    <a
                      href={href}
                      aria-label={client.displayName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center"
                    >
                      {mark}
                    </a>
                  ) : (
                    <span className="inline-flex min-h-11 items-center">{mark}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        {cards[0] ? (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-foreground)]">
            {copy.schoolsNamed.replace("{name}", cards[0].client.displayName)}
          </p>
        ) : null}
        {cards.length > 0 ? (
          <ul className="mt-8 grid gap-8 md:grid-cols-2">
            {cards.map(({ client, href }) => (
              <li key={client.slug}>
                <PulsarClientPreviewCard
                  displayName={client.displayName}
                  href={href}
                  visitText={dict.pulsar.clients.visitSite}
                  visitLabel={dict.pulsar.clients.visitSiteNamed.replace("{name}", client.displayName)}
                  previewVideoSrc={client.previewVideoSrc}
                  previewPosterSrc={client.previewPosterSrc}
                  logoSrc={client.logoSrc}
                  deferVideo
                />
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          href={`/${locale}/clientes`}
          className="mt-10 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
        >
          <ArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span>{copy.schoolsMore}</span>
        </Link>
      </div>
    </section>
  );
}
