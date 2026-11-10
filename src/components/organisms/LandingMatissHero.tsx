import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

export interface LandingMatissHeroProps {
  kicker: string;
  title: string;
  subtitle: string;
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  photoSrc: string;
}

function titleLines(title: string): string[] {
  const lines = title.split(/(?<=\.)\s+/).map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [title];
}

export function LandingMatissHero({
  kicker,
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  photoSrc,
}: LandingMatissHeroProps) {
  const lines = titleLines(title);

  return (
    <section className="matiss-hero" aria-labelledby="matiss-hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:grid-cols-2 md:py-24">
        <div className="order-2 md:order-1">
          <p className="matiss-rise text-sm font-semibold text-[var(--matiss-rose-deep)]">{kicker}</p>
          <h1 id="matiss-hero-title" className="matiss-display mt-3 text-5xl leading-[1.05] text-[var(--matiss-ink)] md:text-6xl">
            {lines.map((line) => (
              <span key={line} className="matiss-rise matiss-title-line block">
                {line}
              </span>
            ))}
          </h1>
          <p className="matiss-rise matiss-hero-lead mt-5 max-w-md text-lg text-[var(--matiss-ink-soft)]">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryHref ? (
              <Link href={primaryHref} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--matiss-violet-deep)] px-7 text-sm font-semibold text-white hover:bg-[var(--matiss-violet-hover)]">
                <Sparkles className="h-4 w-4" aria-hidden />
                {primaryLabel}
              </Link>
            ) : null}
            <Link href={secondaryHref} className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[var(--matiss-violet-deep)] px-7 text-sm font-semibold text-[var(--matiss-violet-deep)] hover:bg-[var(--matiss-lavender)]">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {secondaryLabel}
            </Link>
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <svg className="pointer-events-none absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-[var(--matiss-violet)]" viewBox="0 0 200 240" fill="none" aria-hidden>
            <path className="matiss-arc" d="M36 206 C8 140 28 28 108 18 C176 10 194 78 184 156" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="matiss-star matiss-star-1" aria-hidden />
          <span className="matiss-star matiss-star-2" aria-hidden />
          <span className="matiss-star matiss-star-3" aria-hidden />
          <Image
            src={photoSrc}
            alt=""
            width={902}
            height={1024}
            priority
            className="matiss-float aspect-[3/4] w-full rounded-[45%_45%_40%_60%] object-cover object-top md:aspect-auto md:rounded-[40%_60%_55%_45%]"
          />
        </div>
      </div>
    </section>
  );
}
