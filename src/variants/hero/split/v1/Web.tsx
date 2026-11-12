import { HeroPhoto } from "@/variants/hero/HeroPhoto";
import type { HeroVariantProps } from "@/variants/hero/heroProps";

export default function HeroSplit({ scene, title, body, imageAlt, heroSrc }: HeroVariantProps) {
  return (
    <section id="inicio" className="grid min-h-[70vh] lg:grid-cols-2" data-hero-layout="split">
      <div className="min-h-72 overflow-hidden">
        <HeroPhoto src={heroSrc} alt={imageAlt} className="h-full min-h-72 w-full object-cover" />
      </div>
      <div className="flex flex-col justify-center px-5 py-16 sm:px-12">
        <p className="text-sm text-[var(--color-muted-foreground)]">{scene}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">{body}</p>
      </div>
    </section>
  );
}
