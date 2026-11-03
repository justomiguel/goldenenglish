import { googleMapEmbedUrl } from "@/lib/pulsar/freeSiteShare";

export function GenericLandingMap({ address, title }: { address: string; title: string }) {
  const src = googleMapEmbedUrl(address);
  if (!src || !title) return null;
  return (
    <iframe
      title={title}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="mt-8 aspect-video w-full border border-[var(--color-border)]"
    />
  );
}
