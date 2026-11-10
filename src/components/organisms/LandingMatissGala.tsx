import { MatissPhoto } from "@/components/molecules/MatissPhoto";
import { MatissReveal } from "@/components/molecules/MatissReveal";

export interface LandingMatissGalaProps {
  title: string;
  body: string;
  photoSrc: string;
  photoAlt: string;
}

export function LandingMatissGala({ title, body, photoSrc, photoAlt }: LandingMatissGalaProps) {
  return (
    <MatissReveal preset="section">
      <section className="px-[max(1.5rem,env(safe-area-inset-left))] pb-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:pb-28" aria-labelledby="matiss-gala-title">
        <div className="relative mx-auto max-w-6xl">
          <MatissPhoto
            src={photoSrc}
            alt={photoAlt}
            sizes="(min-width: 1152px) 1152px, 92vw"
            frameClassName="matiss-frame--parallax aspect-[4/5] w-full rounded-[40px] sm:aspect-[16/9]"
          />
          <div className="matiss-stagger relative -mt-24 mx-4 rounded-[32px] bg-white p-7 md:absolute md:bottom-10 md:left-10 md:mx-0 md:mt-0 md:max-w-md md:p-10">
            <h2 id="matiss-gala-title" className="matiss-display text-3xl text-[var(--matiss-ink)] md:text-4xl">{title}</h2>
            <p className="mt-4 leading-relaxed text-[var(--matiss-ink-soft)]">{body}</p>
          </div>
        </div>
      </section>
    </MatissReveal>
  );
}
