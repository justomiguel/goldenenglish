import { MatissPhoto } from "@/components/molecules/MatissPhoto";
import { MatissReveal } from "@/components/molecules/MatissReveal";

export interface LandingMatissManifestoProps {
  title: string;
  body: string;
  alt: string;
  src: string;
}

export function LandingMatissManifesto({ title, body, alt, src }: LandingMatissManifestoProps) {
  return (
    <MatissReveal preset="band" eager>
      <section className="px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-24" aria-labelledby="matiss-manifesto-title">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[3fr_2fr] md:gap-16">
          <MatissPhoto
            src={src}
            alt={alt}
            sizes="(min-width: 768px) 58vw, 92vw"
            frameClassName="matiss-frame--parallax aspect-[4/3] w-full rounded-[40px]"
          />
          <div className="matiss-stagger">
            <h2 id="matiss-manifesto-title" className="matiss-display text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--matiss-ink-soft)]">{body}</p>
            <span className="matiss-line mt-8 block h-px w-24 bg-[var(--matiss-rose-deep)]" aria-hidden />
          </div>
        </div>
      </section>
    </MatissReveal>
  );
}
