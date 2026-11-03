export type SectionDeliveryMode = "in_person" | "hybrid" | "remote";

export function parseDeliveryMode(value: unknown): SectionDeliveryMode {
  if (value === "hybrid" || value === "remote" || value === "in_person") return value;
  return "in_person";
}
