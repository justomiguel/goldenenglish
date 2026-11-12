import styles from "@/components/organisms/generic-landing/genericLanding.module.css";

export function HeroPhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local stock photo in public/generic
    <img
      src={src}
      alt={alt}
      width={1440}
      height={900}
      fetchPriority="high"
      className={`${styles.heroPhoto} ${className}`}
    />
  );
}
