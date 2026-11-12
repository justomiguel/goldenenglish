import { HeroPhoto } from "@/variants/hero/HeroPhoto";
import type { HeroVariantProps } from "@/variants/hero/heroProps";

export default function HeroTitle({ scene, title, body, imageAlt, heroSrc }: HeroVariantProps) {
  return (
    <section id="inicio" data-hero-layout="title">
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-20 sm:pt-28">
        <p className="text-sm text-[var(--color-muted-foreground)]">{scene}</p>
        <h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-7xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">{body}</p>
      </div>
      <div className="overflow-hidden">
        <HeroPhoto src={heroSrc} alt={imageAlt} className="h-[46vh] w-full object-cover object-top" />
      </div>
    </section>
  );
}
