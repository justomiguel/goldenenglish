import { MatissPhoto } from "@/variants/owned/matiss/photo/v1/Web";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";

export interface LandingMatissClassDayProps {
  title: string;
  lead: string;
  steps: readonly { title: string; body: string }[];
  photos: readonly string[];
}

export function LandingMatissClassDay({ title, lead, steps, photos }: LandingMatissClassDayProps) {
  return (
    <MatissReveal preset="steps">
      <section className="bg-[var(--owned-footer)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] text-white md:py-28" aria-labelledby="matiss-class-day-title">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <h2 id="matiss-class-day-title" className="matiss-display text-4xl md:text-5xl">{title}</h2>
            <p className="text-lg leading-relaxed text-neutral-200 md:justify-self-end md:text-right">{lead}</p>
          </div>
          <ol className="matiss-stagger mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
            {steps.map((step, index) => (
              <li key={step.title}>
                <MatissPhoto
                  src={photos[index] ?? photos[0] ?? ""}
                  alt=""
                  sizes="(min-width: 768px) 23vw, 46vw"
                  frameClassName="matiss-frame--zoom aspect-[3/4] w-full rounded-3xl"
                />
                <p className="mt-5 flex items-baseline gap-3">
                  <span className="matiss-display text-sm text-[var(--owned-pink)]" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="matiss-display text-xl">{step.title}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </MatissReveal>
  );
}

export default LandingMatissClassDay;
