import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { GenericHeroLayout } from "@/lib/landing/genericLandingComposition";
import styles from "./genericLanding.module.css";

function HeroPhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local stock photo in public/generic
    <img
      src={src}
      alt={alt}
      width={1440}
      height={900}
      fetchPriority="high"
      className={`${styles.heroPhoto} ${className}`}
    />
  );
}

export function GenericLandingHero({
  layout,
  copy,
  heroSrc,
}: {
  layout: GenericHeroLayout;
  copy: GenericLandingCopy;
  heroSrc: string;
}) {
  const scene = <p className="text-sm text-[var(--color-muted-foreground)]">{copy.scene}</p>;
  const title = (
    <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">{copy.title}</h1>
  );
  const body = (
    <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
      {copy.body}
    </p>
  );

  if (layout === "bleed") {
    return (
      <section className="relative min-h-[78vh] overflow-hidden" data-hero-layout={layout}>
        <HeroPhoto src={heroSrc} alt={copy.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-foreground)_62%,transparent)]" />
        <div className="relative flex min-h-[78vh] flex-col justify-end px-5 py-16 text-[var(--color-background)] sm:px-10">
          <p className="text-sm">{copy.scene}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed">{copy.body}</p>
        </div>
      </section>
    );
  }

  if (layout === "split") {
    return (
      <section className="grid min-h-[70vh] lg:grid-cols-2" data-hero-layout={layout}>
        <div className="min-h-72 overflow-hidden">
          <HeroPhoto src={heroSrc} alt={copy.imageAlt} className="h-full min-h-72 w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center px-5 py-16 sm:px-12">
          {scene}
          {title}
          {body}
        </div>
      </section>
    );
  }

  if (layout === "masthead") {
    return (
      <section data-hero-layout={layout}>
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-16 sm:px-8">
          {scene}
          <p className="mt-8 font-[family-name:var(--font-heading)] text-5xl text-[var(--color-foreground)] sm:text-6xl">
            {copy.name}
          </p>
          {title}
          {body}
        </div>
        <div className="overflow-hidden">
          <HeroPhoto src={heroSrc} alt={copy.imageAlt} className="h-[48vh] w-full object-cover" />
        </div>
      </section>
    );
  }

  if (layout === "stage") {
    return (
      <section
        className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
        data-hero-layout={layout}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="text-sm">{copy.scene}</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed">{copy.body}</p>
          </div>
          <div className="overflow-hidden">
            <HeroPhoto src={heroSrc} alt={copy.imageAlt} className="aspect-[4/5] w-full object-cover" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-hero-layout={layout}>
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-20 sm:pt-28">
        {scene}
        <h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-7xl">{copy.title}</h1>
        {body}
      </div>
      <div className="overflow-hidden">
        <HeroPhoto src={heroSrc} alt={copy.imageAlt} className="h-[46vh] w-full object-cover object-top" />
      </div>
    </section>
  );
}
