import { MatissPhoto } from "@/variants/owned/matiss/photo/v1/Web";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";
import { MatissSeal } from "@/variants/owned/matiss/seal/v1/Web";

export interface LandingMatissBenefitsProps {
  kicker: string;
  title: string;
  lead: string;
  director: string;
  items: readonly { title: string; body: string }[];
  photoSrc: string;
  photoAlt: string;
  sealRing: string;
  logoSrc: string;
}

export function LandingMatissBenefits({
  kicker,
  title,
  lead,
  director,
  items,
  photoSrc,
  photoAlt,
  sealRing,
  logoSrc,
}: LandingMatissBenefitsProps) {
  return (
    <MatissReveal preset="section">
      <section id="sobre" className="scroll-mt-24 bg-[var(--ds-color-muted)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28">
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-[2fr_3fr] md:gap-16">
          <div className="relative md:sticky md:top-28">
            <MatissPhoto
              src={photoSrc}
              alt={photoAlt}
              sizes="(min-width: 768px) 38vw, 92vw"
              frameClassName="matiss-frame--parallax aspect-[3/4] w-full rounded-[40px]"
              imageClassName="object-[50%_35%]"
            />
            <MatissSeal ring={sealRing} logoSrc={logoSrc} size="md" reverse className="absolute -right-3 -top-8 z-10 md:-right-12 md:-top-12" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--owned-rose)]">{kicker}</p>
            <h2 className="matiss-display mt-3 text-4xl text-[var(--ds-color-foreground)] md:text-5xl">{title}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ds-color-muted-foreground)]">{lead}</p>
            <ol className="matiss-stagger mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {items.map((item, index) => (
                <li key={item.title} className="border-t border-[var(--owned-line)] pt-5">
                  <span className="matiss-display text-sm text-[var(--owned-rose)]" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="matiss-display mt-2 text-2xl text-[var(--ds-color-foreground)]">{item.title}</p>
                  <p className="mt-2 leading-relaxed text-[var(--ds-color-muted-foreground)]">{item.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-xl text-sm leading-relaxed text-[var(--ds-color-foreground)]">{director}</p>
          </div>
        </div>
      </section>
    </MatissReveal>
  );
}

export default LandingMatissBenefits;
