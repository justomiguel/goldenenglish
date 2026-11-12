import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import { MatissPhoto } from "@/variants/owned/matiss/photo/v1/Web";
import { MatissSeal } from "@/variants/owned/matiss/seal/v1/Web";

export interface LandingMatissHeroProps {
  kicker: string;
  title: string;
  subtitle: string;
  facts: readonly string[];
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  photoSrc: string;
  photoAlt: string;
  sealRing: string;
  logoSrc: string;
  logoAlt: string;
}

function titleLines(title: string): string[] {
  const lines = title.split(/(?<=\.)\s+/).map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [title];
}

export function LandingMatissHero({
  kicker,
  title,
  subtitle,
  facts,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  photoSrc,
  photoAlt,
  sealRing,
  logoSrc,
  logoAlt,
}: LandingMatissHeroProps) {
  return (
    <section className="matiss-hero" aria-labelledby="matiss-hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-[max(1.5rem,env(safe-area-inset-left))] pb-16 pt-8 pe-[max(1.5rem,env(safe-area-inset-right))] md:grid-cols-[1.05fr_1fr] md:gap-16 md:py-24">
        <div className="order-2 md:order-1">
          <p className="matiss-fade-up text-sm font-semibold text-[var(--owned-rose)]">{kicker}</p>
          <h1 id="matiss-hero-title" className="matiss-display mt-4 text-5xl leading-[1.02] text-[var(--ds-color-foreground)] md:text-7xl">
            {titleLines(title).map((line) => (
              <span key={line} className="matiss-mask">
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <p className="matiss-fade-up matiss-delay-2 mt-6 max-w-lg text-lg leading-relaxed text-[var(--ds-color-muted-foreground)]">
            {subtitle}
          </p>
          <div className="matiss-fade-up matiss-delay-3 mt-8 flex flex-wrap gap-3">
            {primaryHref ? (
              <Link href={primaryHref} className="matiss-btn inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[var(--ds-color-primary)] px-7 text-sm font-semibold text-white hover:bg-[var(--owned-violet-hover)]">
                <Sparkles className="h-4 w-4" aria-hidden />
                {primaryLabel}
              </Link>
            ) : null}
            <Link href={secondaryHref} className="matiss-btn inline-flex min-h-[52px] items-center gap-2 rounded-full border border-[var(--ds-color-primary)] px-7 text-sm font-semibold text-[var(--ds-color-primary)] hover:bg-[var(--ds-color-muted)]">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {secondaryLabel}
            </Link>
          </div>
          <ul className="matiss-fade-up matiss-delay-4 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ds-color-foreground)]">
            {facts.map((fact) => (
              <li key={fact} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--owned-rose)]" aria-hidden />
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative order-1 md:order-2">
          <svg className="pointer-events-none absolute -inset-4 z-10 h-[calc(100%+2rem)] w-[calc(100%+2rem)] text-[var(--owned-violet)]" viewBox="0 0 200 240" fill="none" preserveAspectRatio="none" aria-hidden>
            <path className="matiss-arc" d="M30 214 C6 150 18 30 104 14 C180 2 198 84 186 170" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <MatissPhoto
            src={photoSrc}
            alt={photoAlt}
            sizes="(min-width: 768px) 46vw, 92vw"
            priority
            frameClassName="matiss-hero-photo aspect-[4/5] w-full rounded-t-[999px] rounded-b-[40px] bg-[var(--ds-color-muted)]"
            imageClassName="object-[50%_30%]"
          />
          <MatissSeal
            ring={sealRing}
            logoSrc={logoSrc}
            logoAlt={logoAlt}
            size="lg"
            className="matiss-fade-up matiss-delay-3 absolute -bottom-10 -left-3 z-20 md:-bottom-12 md:-left-14"
          />
        </div>
      </div>
    </section>
  );
}

export default LandingMatissHero;
