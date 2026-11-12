import { HeroPhoto } from "@/variants/hero/HeroPhoto";
import type { HeroVariantProps } from "@/variants/hero/heroProps";

export default function HeroMasthead({ scene, title, body, imageAlt, name, heroSrc }: HeroVariantProps) {
  return (
    <section id="inicio" data-hero-layout="masthead">
      <div className="mx-auto max-w-5xl px-5 pb-8 pt-16 sm:px-8">
        <p className="text-sm text-[var(--color-muted-foreground)]">{scene}</p>
        <p className="mt-8 font-[family-name:var(--font-heading)] text-5xl text-[var(--color-foreground)] sm:text-6xl">
          {name}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">{body}</p>
      </div>
      <div className="overflow-hidden">
        <HeroPhoto src={heroSrc} alt={imageAlt} className="h-[48vh] w-full object-cover" />
      </div>
    </section>
  );
}
