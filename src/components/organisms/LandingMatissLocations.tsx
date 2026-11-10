import { MapPin } from "lucide-react";
import { MatissReveal } from "@/components/molecules/MatissReveal";

export interface MatissLocationCopy {
  key: "sanMiguel" | "laFlorida";
  name: string;
  body: string;
  /** Street address. The maps link searches this, not the commune name alone. */
  address: string;
}

export interface LandingMatissLocationsProps {
  title: string;
  lead: string;
  mapsLabel: string;
  locations: readonly MatissLocationCopy[];
}

export function LandingMatissLocations({ title, lead, mapsLabel, locations }: LandingMatissLocationsProps) {
  return (
    <MatissReveal preset="section">
      <section id="sedes" className="scroll-mt-24 bg-[var(--matiss-lavender)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="matiss-display text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
          <div className="matiss-stagger mt-10 grid gap-10 md:grid-cols-2">
            {locations.map((location) => (
              <article key={location.key} className="border-t border-[var(--matiss-line)] pt-6">
                <h3 className="matiss-display text-3xl text-[var(--matiss-ink)]">{location.name}</h3>
                <p className="mt-3 leading-relaxed text-[var(--matiss-ink-soft)]">{location.body}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--matiss-violet-deep)] underline underline-offset-4"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {mapsLabel}
                </a>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-[var(--matiss-ink-soft)]">{lead}</p>
        </div>
      </section>
    </MatissReveal>
  );
}
