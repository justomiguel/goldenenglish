import { LandingTiltedPhoto } from "@/components/molecules/LandingTiltedPhoto";
import { modalidadesCollageSrc } from "@/lib/landing/sectionLandingImages";

interface RegisterCollageProps {
  /** Four alt strings, e.g. `dict.landing.collage.alts`. */
  alts: readonly string[];
}

const COUNT = 4;

const desktopStack: readonly { index: number; box: string }[] = [
  {
    index: 0,
    box: "left-[0%] top-8 w-[70%] -rotate-6 sm:w-[58%] md:left-[2%] md:top-10 md:w-[46%]",
  },
  {
    index: 1,
    box: "right-[0%] top-0 z-20 w-[68%] rotate-[8deg] sm:w-[56%] md:right-[4%] md:top-4 md:w-[44%]",
  },
  {
    index: 2,
    box: "left-[6%] bottom-6 z-10 w-[62%] rotate-[5deg] sm:w-[50%] md:left-[12%] md:bottom-10 md:w-[40%]",
  },
  {
    index: 3,
    box: "right-[2%] bottom-0 z-30 w-[66%] -rotate-3 sm:bottom-4 sm:w-[54%] md:right-[8%] md:bottom-14 md:w-[42%]",
  },
] as const;

const mobileRotations = ["-rotate-3", "rotate-[6deg]", "rotate-2", "-rotate-2"] as const;

export function RegisterCollage({ alts }: RegisterCollageProps) {
  return (
    <div className="w-full">
      <div
        className="mx-auto mb-5 h-1 w-14 rounded-full bg-[var(--color-accent)] lg:mx-0"
        aria-hidden
      />

      <div className="relative mx-auto lg:mx-0">
        <div
          className="landing-informal-wash pointer-events-none absolute inset-0 -z-10 rounded-[calc(var(--layout-border-radius)+0.75rem)] opacity-[0.5]"
          aria-hidden
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
          {Array.from({ length: COUNT }, (_, idx) => (
            <LandingTiltedPhoto
              key={idx}
              src={modalidadesCollageSrc(idx)}
              alt={alts[idx] ?? ""}
              rotateClass={mobileRotations[idx] ?? "-rotate-2"}
              className="w-full"
              sizes="(max-width: 640px) 45vw, 200px"
            />
          ))}
        </div>

        <div className="relative mx-auto hidden min-h-[26rem] max-w-xl md:min-h-[28rem] lg:block">
          {desktopStack.map(({ index, box }) => (
            <LandingTiltedPhoto
              key={index}
              src={modalidadesCollageSrc(index)}
              alt={alts[index] ?? ""}
              className={`absolute ${box}`}
              rotateClass=""
              sizes="(max-width: 1024px) 40vw, 380px"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
