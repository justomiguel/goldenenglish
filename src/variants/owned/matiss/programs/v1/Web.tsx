import { MATISS_GROUPS, type MatissWeekday } from "@/lib/landing/matissSchedule";
import { MatissPhoto } from "@/variants/owned/matiss/photo/v1/Web";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";

export interface MatissProgramCopy {
  name: string;
  body: string;
  alt: string;
}

export interface LandingMatissProgramsProps {
  title: string;
  lead: string;
  dayLabels: Record<MatissWeekday, string>;
  yearsLabel: string;
  locationNames: Record<"sanMiguel" | "laFlorida", string>;
  programs: Record<string, MatissProgramCopy>;
  photos: readonly string[];
  children?: React.ReactNode;
}

export function LandingMatissPrograms({
  title,
  lead,
  dayLabels,
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
          <h2 className="matiss-display max-w-2xl text-4xl text-[var(--ds-color-foreground)] md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-xl text-lg text-[var(--ds-color-muted-foreground)]">{lead}</p>
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
                    <p className="text-sm font-semibold text-[var(--owned-rose)]">{locationNames[group.location]}</p>
                    <h3 className="matiss-display mt-1 text-3xl text-[var(--ds-color-foreground)]">{copy?.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-[var(--ds-color-foreground)]">
                      {group.ageMin}–{group.ageMax} {yearsLabel} · {dayLabels[group.day]} {group.start}–{group.end}
                    </p>
                    <p className="mt-3 leading-relaxed text-[var(--ds-color-muted-foreground)]">{copy?.body}</p>
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

export default LandingMatissPrograms;
