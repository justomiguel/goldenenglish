import { MapPin } from "lucide-react";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";

interface LandingStoryProps {
  dict: Dictionary;
  brand: BrandPublic;
}

export function LandingStory({ dict, brand }: LandingStoryProps) {
  return (
    <LandingSection id="historia" title={dict.landing.story.title}>
      <div className="relative mx-auto max-w-3xl">
        <div className="absolute -left-4 top-0 hidden h-full w-1 rounded-full bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-primary)]/30 md:block" />
        <blockquote className="font-display relative text-center text-2xl font-medium leading-snug text-[var(--color-primary)] md:text-left md:text-3xl md:leading-snug">
          <span className="text-[var(--color-accent)]" aria-hidden="true">
            “
          </span>
          <span className="text-balance">{dict.landing.story.body1}</span>
          <span className="text-[var(--color-accent)]" aria-hidden="true">
            ”
          </span>
        </blockquote>
        <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-[var(--color-muted-foreground)] md:text-left">
          {dict.landing.story.body2}
        </p>
        <p className="mt-10 flex items-start justify-center gap-2 text-sm font-medium text-[var(--color-primary)] md:justify-start">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)] opacity-90"
            aria-hidden
            strokeWidth={1.75}
          />
          <span>{brand.contactAddress}</span>
        </p>
      </div>
    </LandingSection>
  );
}
