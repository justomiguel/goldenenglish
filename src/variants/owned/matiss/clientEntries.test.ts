import { describe, expect, it } from "vitest";
import { CLIENT_VARIANT_ENTRIES } from "@/variants/clientEntries";
import { MATISS_CLIENT_ENTRIES } from "@/variants/owned/matiss/clientEntries";

const INTERACTIVE = [
  "nav.matiss@1",
  "schedule.matiss-age@1",
  "band.matiss-gallery@1",
  "faq.matiss-phone@1",
  "contact.matiss@1",
  "page.matiss-home@1",
  "page.matiss-register@1",
  "page.matiss-contact@1",
] as const;

describe("Matiss client entries", () => {
  it("registers every interactive variant for the surface switch", () => {
    for (const key of INTERACTIVE) {
      expect(MATISS_CLIENT_ENTRIES[key]?.web).toBeTruthy();
      expect(MATISS_CLIENT_ENTRIES[key]?.pwa).toBeTruthy();
      expect(CLIENT_VARIANT_ENTRIES[key]).toBe(MATISS_CLIENT_ENTRIES[key]);
    }
  });
});
