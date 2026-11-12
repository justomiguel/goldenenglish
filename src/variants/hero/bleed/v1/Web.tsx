import { HeroPhoto } from "@/variants/hero/HeroPhoto";
import type { HeroVariantProps } from "@/variants/hero/heroProps";

export default function HeroBleed({ scene, title, body, imageAlt, heroSrc }: HeroVariantProps) {
  return (
    <section id="inicio" className="relative min-h-[78vh] overflow-hidden" data-hero-layout="bleed">
      <HeroPhoto src={heroSrc} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-foreground)_62%,transparent)]" />
      <div className="relative flex min-h-[78vh] flex-col justify-end px-5 py-16 pb-[max(5.5rem,env(safe-area-inset-bottom,0px))] text-[var(--color-background)] max-md:pb-28 sm:px-10">
        <p className="text-sm">{scene}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed">{body}</p>
      </div>
    </section>
  );
}
