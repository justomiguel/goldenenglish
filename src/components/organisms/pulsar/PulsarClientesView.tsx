import { ExternalLink, Globe } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

export interface PulsarClientSummary {
  slug: string;
  displayName: string;
  hosts: string[];
  publicUrl: string | null;
}

export interface PulsarClientesViewProps {
  locale: string;
  dict: Dictionary;
  clients: readonly PulsarClientSummary[];
}

export function PulsarClientesView({
  locale,
  dict,
  clients,
}: PulsarClientesViewProps) {
  const copy = dict.pulsar.clients;

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="clients">
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
            {clients.map((client) => {
              const href =
                client.publicUrl ??
                (client.hosts[0] ? `https://${client.hosts[0]}` : null);
              return (
                <article
                  key={client.slug}
                  className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                        <Globe className="h-3.5 w-3.5" aria-hidden />
                        <span>{copy.activeBadge}</span>
                      </span>
                      <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                        {client.slug}
                      </span>
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">
                      {client.displayName}
                    </h2>
                    <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                      {copy.hostsLabel}:{" "}
                      <span className="font-mono">{client.hosts.join(", ")}</span>
                    </p>
                  </div>

                  {href ? (
                    <div className="mt-6">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                      >
                        <ExternalLink className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                        <span>{copy.visitSite}</span>
                      </a>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
