import Image from "next/image";
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
      <section className="px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))]" aria-labelledby="matiss-manifesto-title">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[3fr_2fr]">
          <Image src={src} alt={alt} width={1024} height={751} className="matiss-manifesto-photo w-full rounded-[40px] object-cover" />
          <div>
            <h2 id="matiss-manifesto-title" className="matiss-display text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--matiss-ink-soft)]">{body}</p>
            <span className="matiss-line mt-8 block h-px w-24 bg-[var(--matiss-pink)]" aria-hidden />
          </div>
        </div>
      </section>
    </MatissReveal>
  );
}
