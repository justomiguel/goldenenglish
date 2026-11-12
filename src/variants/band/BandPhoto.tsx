export function BandPhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local stock photo in public/generic
    <img src={src} alt={alt} width={1200} height={640} className={className} />
  );
}
