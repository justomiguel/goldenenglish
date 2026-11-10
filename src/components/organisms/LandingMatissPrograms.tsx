import { MATISS_GROUPS } from "@/lib/landing/matissSchedule";
import { MatissPhoto } from "@/components/molecules/MatissPhoto";
import { MatissReveal } from "@/components/molecules/MatissReveal";

export interface MatissProgramCopy {
  name: string;
  body: string;
  alt: string;
}

export interface LandingMatissProgramsProps {
  title: string;
  lead: string;
  dayLabel: string;
  yearsLabel: string;
  locationNames: Record<"sanMiguel" | "laFlorida", string>;
  programs: Record<string, MatissProgramCopy>;
  photos: readonly string[];
  children?: React.ReactNode;
}

export function LandingMatissPrograms({
  title,
  lead,
  dayLabel,
  yearsLabel,
  locationNames,
  programs,
  photos,
  children,
}: LandingMatissProgramsProps) {
  return (
    <MatissReveal preset="steps">
      <section id="clases" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="matiss-display max-w-2xl text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-xl text-lg text-[var(--matiss-ink-soft)]">{lead}</p>
          <ul className="matiss-stagger mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {MATISS_GROUPS.map((group, index) => {
              const copy = programs[group.id];
              return (
                <li key={group.id} className="grid grid-cols-[7rem_1fr] items-start gap-5 md:block">
                  <MatissPhoto
                    src={photos[index] ?? photos[0] ?? ""}
                    alt={copy?.alt ?? ""}
                    sizes="(min-width: 768px) 30vw, 7rem"
                    frameClassName="matiss-frame--zoom aspect-[4/5] w-full rounded-3xl md:rounded-[32px]"
                    imageClassName="object-[50%_30%]"
                  />
                  <div className="md:mt-6">
                    <p className="text-sm font-semibold text-[var(--matiss-rose-deep)]">{locationNames[group.location]}</p>
                    <h3 className="matiss-display mt-1 text-3xl text-[var(--matiss-ink)]">{copy?.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-[var(--matiss-ink)]">
                      {group.ageMin}–{group.ageMax} {yearsLabel} · {dayLabel} {group.start}–{group.end}
                    </p>
                    <p className="mt-3 leading-relaxed text-[var(--matiss-ink-soft)]">{copy?.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {children}
        </div>
      </section>
    </MatissReveal>
  );
}
