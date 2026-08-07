import { describe, expect, it } from "vitest";
import {
  resolveWhatsAppCountry,
  resolveWhatsAppDigits,
} from "@/lib/whatsapp/resolveWhatsAppDigits";

describe("resolveWhatsAppCountry", () => {
  it("reads the country from the institute phone in international form", () => {
    expect(resolveWhatsAppCountry("+54 9 362 470-8145")).toBe("AR");
    expect(resolveWhatsAppCountry("+56 2 2222 2222")).toBe("CL");
  });

  it("returns null when the institute phone has no country", () => {
    expect(resolveWhatsAppCountry("362 470-8145")).toBeNull();
    expect(resolveWhatsAppCountry("")).toBeNull();
    expect(resolveWhatsAppCountry(null)).toBeNull();
    expect(resolveWhatsAppCountry(undefined)).toBeNull();
  });
});

describe("resolveWhatsAppDigits", () => {
  it("keeps an already-international number regardless of the default country", () => {
    expect(resolveWhatsAppDigits("+54 9 362 470-8145", "CL")).toBe("5493624708145");
  });

  it("normalizes a local Argentine number to the same digits as its international form", () => {
    const local = resolveWhatsAppDigits("0362 15 470-8145", "AR");
    const international = resolveWhatsAppDigits("+54 9 362 470-8145", "AR");
    expect(local).toBe(international);
  });

  it("returns null when there is no default country and the number is local", () => {
    expect(resolveWhatsAppDigits("362 470-8145", null)).toBeNull();
  });

  it("returns null for blank, junk or impossible numbers", () => {
    expect(resolveWhatsAppDigits("", "AR")).toBeNull();
    expect(resolveWhatsAppDigits(null, "AR")).toBeNull();
    expect(resolveWhatsAppDigits(undefined, "AR")).toBeNull();
    expect(resolveWhatsAppDigits("no es un telefono", "AR")).toBeNull();
    expect(resolveWhatsAppDigits("123", "AR")).toBeNull();
  });
});
