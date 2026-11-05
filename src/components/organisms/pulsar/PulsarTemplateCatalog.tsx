import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { PulsarTemplateCatalogCard } from "@/lib/pulsar/pulsarTemplateCatalog";

export function PulsarTemplateCatalog({
  title,
  lead,
  cards,
}: {
  title: string;
  lead: string;
  cards: readonly PulsarTemplateCatalogCard[];
}) {
  return (
    <section className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{title}</h1>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{lead}</p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.kind}
            className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- stock screenshot in public/generic */}
            <img
              src={card.src}
              alt={card.name}
              width={1440}
              height={900}
              className="aspect-video w-full object-cover object-top"
            />
            <div className="space-y-3 p-4">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">{card.name}</h2>
              <Link
                href={card.href}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-dark)] hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                {card.openLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
