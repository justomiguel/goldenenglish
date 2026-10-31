export const PULSAR_SEGMENT_SLUGS = [
  "danza",
  "musica",
  "idiomas",
  "deportes",
  "eventos",
] as const;

export type PulsarSegmentSlug = (typeof PULSAR_SEGMENT_SLUGS)[number];

export function isPulsarSegmentSlug(value: string): value is PulsarSegmentSlug {
  return (PULSAR_SEGMENT_SLUGS as readonly string[]).includes(value);
}
