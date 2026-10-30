export const PARTNER_IDS = [
  "flow",
  "mercadopago",
  "whatsapp",
  "resend",
  "googlemaps",
  "upstash",
  "supabase",
  "vercel",
] as const;

export type PartnerId = (typeof PARTNER_IDS)[number];

export const PARTNER_SRC: Record<PartnerId, string> = {
  flow: "/pulsar/partners/flow.svg",
  mercadopago: "/pulsar/partners/mercadopago.svg",
  whatsapp: "/pulsar/partners/whatsapp.svg",
  resend: "/pulsar/partners/resend.svg",
  googlemaps: "/pulsar/partners/googlemaps.svg",
  upstash: "/pulsar/partners/upstash.svg",
  supabase: "/pulsar/partners/supabase.svg",
  vercel: "/pulsar/partners/vercel.svg",
};

export type HomeMarkId = "whatsapp" | "flow" | "mercadopago";

/** Brands the CentroListo home already names in that week moment. */
export function homeMomentMarks(tabId: string): readonly HomeMarkId[] {
  if (tabId === "sunday-night" || tabId === "friday-evening") return ["whatsapp"];
  if (tabId === "fifth-day") return ["flow", "mercadopago"];
  return [];
}

const ORDER: readonly PartnerId[] = PARTNER_IDS;

export function connectedPartners(input: {
  resend: boolean;
  whatsapp: boolean;
  maps: boolean;
  kv: boolean;
  hosts: boolean;
  gateways: readonly string[];
}): PartnerId[] {
  const on = new Set<PartnerId>(["supabase"]);
  if (input.hosts) on.add("vercel");
  if (input.resend) on.add("resend");
  if (input.whatsapp) on.add("whatsapp");
  if (input.maps) on.add("googlemaps");
  if (input.kv) on.add("upstash");
  for (const gateway of input.gateways) {
    if (gateway === "flow" || gateway === "mercadopago") on.add(gateway);
  }
  return ORDER.filter((id) => on.has(id));
}
