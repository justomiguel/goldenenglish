import { MatissPhoto } from "@/components/molecules/MatissPhoto";
import { MatissReveal } from "@/components/molecules/MatissReveal";

export interface LandingMatissBenefitsProps {
  kicker: string;
  title: string;
  lead: string;
  director: string;
  items: readonly { title: string; body: string }[];
  photoSrc: string;
  photoAlt: string;
}

export function LandingMatissBenefits({ kicker, title, lead, director, items, photoSrc, photoAlt }: LandingMatissBenefitsProps) {
  return (
    <MatissReveal preset="section">
      <section id="sobre" className="scroll-mt-24 bg-[var(--matiss-lavender)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28">
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-[2fr_3fr] md:gap-16">
          <MatissPhoto
            src={photoSrc}
            alt={photoAlt}
            sizes="(min-width: 768px) 38vw, 92vw"
            frameClassName="matiss-frame--parallax aspect-[3/4] w-full rounded-[40px] md:sticky md:top-28"
            imageClassName="object-[50%_35%]"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--matiss-rose-deep)]">{kicker}</p>
            <h2 className="matiss-display mt-3 text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--matiss-ink-soft)]">{lead}</p>
            <ol className="matiss-stagger mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {items.map((item, index) => (
                <li key={item.title} className="border-t border-[var(--matiss-line)] pt-5">
                  <span className="matiss-display text-sm text-[var(--matiss-rose-deep)]" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="matiss-display mt-2 text-2xl text-[var(--matiss-ink)]">{item.title}</p>
                  <p className="mt-2 leading-relaxed text-[var(--matiss-ink-soft)]">{item.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-xl text-sm leading-relaxed text-[var(--matiss-ink)]">{director}</p>
          </div>
        </div>
      </section>
    </MatissReveal>
  );
}
