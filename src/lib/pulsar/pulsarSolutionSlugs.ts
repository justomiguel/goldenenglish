export const PULSAR_SOLUTION_SLUGS = ["presencia", "gestion", "ecosistema"] as const;

export type PulsarSolutionSlug = (typeof PULSAR_SOLUTION_SLUGS)[number];

export function isPulsarSolutionSlug(value: string): value is PulsarSolutionSlug {
  return (PULSAR_SOLUTION_SLUGS as readonly string[]).includes(value);
}
