import { describe, expect, it } from "vitest";
import { connectedPartners, homeMomentMarks } from "@/lib/pulsar/connectedPartners";

describe("connectedPartners", () => {
  it("lists Flow, Mercado Pago, and WhatsApp only when that institute has them", () => {
    expect(
      connectedPartners({
        resend: true,
        whatsapp: true,
        maps: false,
        kv: false,
        hosts: true,
        gateways: ["flow", "mercadopago"],
      }),
    ).toEqual(["flow", "mercadopago", "whatsapp", "resend", "supabase", "vercel"]);
  });

  it("names WhatsApp, Flow, and Mercado Pago on the home moments that mention them", () => {
    expect(homeMomentMarks("sunday-night")).toEqual(["whatsapp"]);
    expect(homeMomentMarks("fifth-day")).toEqual(["flow", "mercadopago"]);
    expect(homeMomentMarks("friday-evening")).toEqual(["whatsapp"]);
    expect(homeMomentMarks("tuesday-class")).toEqual([]);
  });

  it("keeps Supabase when nothing else is connected", () => {
    expect(
      connectedPartners({
        resend: false,
        whatsapp: false,
        maps: false,
        kv: false,
        hosts: false,
        gateways: [],
      }),
    ).toEqual(["supabase"]);
  });
});
