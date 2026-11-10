import Image from "next/image";

export interface MatissPhotoProps {
  src: string;
  alt: string;
  sizes: string;
  /** Frame size, shape, and motion modifiers (`matiss-frame--zoom`, `matiss-frame--parallax`). */
  frameClassName: string;
  imageClassName?: string;
  priority?: boolean;
}

export function MatissPhoto({ src, alt, sizes, frameClassName, imageClassName, priority }: MatissPhotoProps) {
  return (
    <figure className={`matiss-frame relative overflow-hidden ${frameClassName}`}>
      <span className="matiss-drift absolute inset-0 block">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`matiss-frame-img object-cover ${imageClassName ?? "object-center"}`}
        />
      </span>
    </figure>
  );
}
