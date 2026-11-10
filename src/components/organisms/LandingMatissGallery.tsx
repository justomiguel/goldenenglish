import { MatissPhoto } from "@/components/molecules/MatissPhoto";
import { MatissReveal } from "@/components/molecules/MatissReveal";

export interface LandingMatissGalleryProps {
  title: string;
  alt: string;
  photos: readonly string[];
}

const TILE_SHAPE = ["row-span-2", "", "row-span-2", "", "", "row-span-2", "", ""] as const;

export function LandingMatissGallery({ title, alt, photos }: LandingMatissGalleryProps) {
  return (
    <MatissReveal preset="steps">
      <section id="galeria" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="matiss-display text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
          <ul className="matiss-stagger mt-10 grid auto-rows-[10rem] grid-cols-2 gap-3 md:auto-rows-[13rem] md:grid-cols-4 md:gap-4">
            {photos.map((src, index) => (
              <li key={`${src}-${index}`} className={TILE_SHAPE[index % TILE_SHAPE.length]}>
                <MatissPhoto
                  src={src}
                  alt={alt}
                  sizes="(min-width: 768px) 24vw, 46vw"
                  frameClassName="matiss-frame--zoom h-full w-full rounded-3xl"
                  imageClassName="object-[50%_30%]"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MatissReveal>
  );
}
