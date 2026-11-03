import { describe, expect, it } from "vitest";
import { hideUnsetGenericContact } from "@/lib/theme/genericPublicProperties";

describe("hideUnsetGenericContact", () => {
  it("drops Golden contact when the generic theme did not set it", () => {
    const merged = hideUnsetGenericContact(
      {
        "contact.phone": "+54 11 0000",
        "social.instagram": "https://instagram.com/golden",
        "app.tagline": "Golden tagline",
        "app.name": "Club Sur",
      },
      { "app.name": "Club Sur" },
      "deportes",
    );
    expect(merged["contact.phone"]).toBeUndefined();
    expect(merged["social.instagram"]).toBeUndefined();
    expect(merged["app.tagline"]).toBeUndefined();
    expect(merged["app.name"]).toBe("Club Sur");
  });

  it("keeps a contact value the owner saved", () => {
    const merged = hideUnsetGenericContact(
      { "contact.phone": "+54 11 0000" },
      { "contact.phone": "+54 11 2222" },
      "deportes",
    );
    expect(merged["contact.phone"]).toBe("+54 11 2222");
  });

  it("leaves a branded theme alone", () => {
    const merged = hideUnsetGenericContact(
      { "contact.phone": "+54 11 0000" },
      {},
      "classic",
    );
    expect(merged["contact.phone"]).toBe("+54 11 0000");
  });
});
