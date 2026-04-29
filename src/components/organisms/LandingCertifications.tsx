import Image from "next/image";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { certificacionesSlotSrc } from "@/lib/landing/certificacionesImages";

interface LandingCertificationsProps {
  dict: Dictionary;
  mediaMap?: LandingMediaMap;
}

const cardClass =
  "flex h-full flex-col items-center rounded-[var(--layout-border-radius)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-soft)] md:p-7";

function bypassOptimizer(src: string): boolean {
  return src.startsWith("/images/");
}

function CertLogosInstitutional({
  alt,
  mediaMap,
}: {
  alt: string;
  mediaMap?: LandingMediaMap;
}) {
  const src = certificacionesSlotSrc(2, mediaMap);
  return (
    <div className="relative mb-5 h-36 w-full max-w-[15rem] shrink-0">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={bypassOptimizer(src)}
        className="object-contain object-center"
        sizes="(max-width: 768px) 75vw, 240px"
      />
    </div>
  );
}

function CertLogosNational({
  altGolden,
  altUtn,
  mediaMap,
}: {
  altGolden: string;
  altUtn: string;
  mediaMap?: LandingMediaMap;
}) {
  const goldenSrc = certificacionesSlotSrc(2, mediaMap);
  const utnSrc = certificacionesSlotSrc(1, mediaMap);
  return (
    <div className="mb-5 flex w-full max-w-xl flex-col items-center justify-center gap-5 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative h-16 w-28 shrink-0 sm:h-[4.5rem] sm:w-32">
        <Image
          src={goldenSrc}
          alt={altGolden}
          fill
          unoptimized={bypassOptimizer(goldenSrc)}
          className="object-contain object-center"
          sizes="140px"
        />
      </div>
      <div className="relative h-24 w-full min-w-0 max-w-sm sm:h-28">
        <Image
          src={utnSrc}
          alt={altUtn}
          fill
          unoptimized={bypassOptimizer(utnSrc)}
          className="object-contain object-center"
          sizes="(max-width: 640px) 85vw, 320px"
        />
      </div>
    </div>
  );
}

function CertLogosInternational({
  altGolden,
  altCambridge,
  mediaMap,
}: {
  altGolden: string;
  altCambridge: string;
  mediaMap?: LandingMediaMap;
}) {
  const goldenSrc = certificacionesSlotSrc(2, mediaMap);
  const cambridgeSrc = certificacionesSlotSrc(3, mediaMap);
  return (
    <div className="mb-5 flex w-full flex-wrap items-center justify-center gap-6 sm:gap-8">
      <div className="relative h-16 w-28 shrink-0 sm:h-[4.5rem] sm:w-32">
        <Image
          src={goldenSrc}
          alt={altGolden}
          fill
          unoptimized={bypassOptimizer(goldenSrc)}
          className="object-contain object-center"
          sizes="140px"
        />
      </div>
      <div className="relative h-20 w-32 shrink-0 sm:h-24 sm:w-36">
        <Image
          src={cambridgeSrc}
          alt={altCambridge}
          fill
          unoptimized={bypassOptimizer(cambridgeSrc)}
          className="object-contain object-center"
          sizes="160px"
        />
      </div>
    </div>
  );
}

export function LandingCertifications({
  dict,
  mediaMap,
}: LandingCertificationsProps) {
  const c = dict.landing.certs;

  return (
    <LandingSection
      id="certificaciones"
      title={dict.landing.certs.title}
      className="relative bg-[var(--color-accent)] [&_header_span[aria-hidden]]:bg-[var(--color-primary)]"
    >
      <div className="relative mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
        <article className={cardClass}>
          <CertLogosInstitutional alt={c.altGoldenMark} mediaMap={mediaMap} />
          <h3 className="mb-4 max-w-sm font-sans text-base font-bold italic text-[var(--color-foreground)]">
            {c.cardInstitutional}
          </h3>
          <p className="font-display text-balance text-sm leading-relaxed text-[var(--color-foreground)] md:text-[0.9375rem]">
            {c.edu}
          </p>
        </article>

        <article className={cardClass}>
          <CertLogosNational
            altGolden={c.altGoldenMark}
            altUtn={c.altUtnIngles}
            mediaMap={mediaMap}
          />
          <h3 className="mb-4 max-w-sm font-sans text-base font-bold italic text-[var(--color-foreground)]">
            {c.cardNational}
          </h3>
          <p className="font-display text-balance text-sm leading-relaxed text-[var(--color-foreground)] md:text-[0.9375rem]">
            {c.utn}
          </p>
        </article>

        <article className={cardClass}>
          <CertLogosInternational
            altGolden={c.altGoldenMark}
            altCambridge={c.altCambridgeUniversity}
            mediaMap={mediaMap}
          />
          <h3 className="mb-4 max-w-sm font-sans text-base font-bold italic text-[var(--color-foreground)]">
            {c.cardInternational}
          </h3>
          <p className="font-display text-balance text-sm leading-relaxed text-[var(--color-foreground)] md:text-[0.9375rem]">
            {c.cambridge}
          </p>
        </article>
      </div>
    </LandingSection>
  );
}
