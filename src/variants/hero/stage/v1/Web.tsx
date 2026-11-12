import { HeroPhoto } from "@/variants/hero/HeroPhoto";
import type { HeroVariantProps } from "@/variants/hero/heroProps";

export default function HeroStage({ scene, title, body, imageAlt, heroSrc }: HeroVariantProps) {
  return (
    <section
      className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
      id="inicio"
      data-hero-layout="stage"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="text-sm">{scene}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed">{body}</p>
        </div>
        <div className="overflow-hidden">
          <HeroPhoto src={heroSrc} alt={imageAlt} className="aspect-[4/5] w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
