import { MapPin } from "lucide-react";
import { LandingSection } from "@/components/molecules/LandingSection";
import { LandingTiltedPhoto } from "@/components/molecules/LandingTiltedPhoto";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import {
  HISTORIA_IMAGES,
  sectionImageSrc,
} from "@/lib/landing/sectionLandingImages";

interface LandingStoryProps {
  dict: Dictionary;
  brand: BrandPublic;
}

export function LandingStory({ dict, brand }: LandingStoryProps) {
  const alts = dict.landing.collage.alts;

  return (
    <LandingSection
      id="historia"
      title={dict.landing.story.title}
      className="relative overflow-visible"
    >
      <div className="relative">
        <div
          className="landing-informal-wash pointer-events-none absolute left-1/2 top-0 -z-10 h-full min-h-full w-screen max-w-[100vw] -translate-x-1/2 opacity-[0.55]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="relative mx-auto max-w-3xl lg:mx-0">
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

        <div className="relative mx-auto hidden min-h-[18rem] w-full max-w-md md:block lg:mx-0 lg:max-w-none">
          <LandingTiltedPhoto
            src={sectionImageSrc("historia", HISTORIA_IMAGES[0])}
            alt={alts[2] ?? ""}
            className="absolute right-[6%] top-4 w-[62%]"
            rotateClass="rotate-[6deg]"
            sizes="320px"
          />
          <LandingTiltedPhoto
            src={sectionImageSrc("historia", HISTORIA_IMAGES[1])}
            alt={alts[3] ?? ""}
            className="absolute bottom-2 left-0 w-[58%]"
            rotateClass="-rotate-4"
            sizes="300px"
          />
        </div>
        </div>
      </div>
    </LandingSection>
  );
}
