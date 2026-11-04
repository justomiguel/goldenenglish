import { describe, expect, it } from "vitest";
import {
  facebookUrl,
  freeSiteNameProperties,
  freeSiteShareProperties,
  googleMapEmbedUrl,
  instagramUrl,
  whatsappUrl,
} from "@/lib/pulsar/freeSiteShare";

describe("freeSiteShare", () => {
  it("turns a WhatsApp number or a wa.me link into a safe URL", () => {
    expect(whatsappUrl("5491122334455")).toBe("https://wa.me/5491122334455");
    expect(whatsappUrl("https://wa.me/5491122334455")).toBe("https://wa.me/5491122334455");
    expect(whatsappUrl("javascript:alert(1)")).toBeNull();
    expect(whatsappUrl("https://example.com")).toBeNull();
  });

  it("accepts an Instagram handle or URL", () => {
    expect(instagramUrl("@club.sur")).toBe("https://instagram.com/club.sur");
    expect(instagramUrl("https://instagram.com/club.sur")).toBe("https://instagram.com/club.sur");
    expect(instagramUrl("javascript:alert(1)")).toBeNull();
  });

  it("accepts a Facebook handle or URL", () => {
    expect(facebookUrl("club.sur")).toBe("https://facebook.com/club.sur");
    expect(facebookUrl("https://facebook.com/club.sur")).toBe("https://facebook.com/club.sur");
    expect(facebookUrl("javascript:alert(1)")).toBeNull();
  });

  it("builds a map URL only when the address has text", () => {
    expect(googleMapEmbedUrl("")).toBeNull();
    expect(googleMapEmbedUrl("  ")).toBeNull();
    expect(googleMapEmbedUrl("Calle 1")).toBe(
      "https://maps.google.com/maps?q=Calle%201&z=16&output=embed",
    );
  });

  it("writes the account email and drops a blank social field", () => {
    const props = freeSiteShareProperties({
      email: "ana@example.com",
      phone: " 11 2222 3333 ",
      whatsapp: "",
      instagram: "club",
      facebook: "",
      address: "Calle 1",
      displayName: "Club Sur",
    });
    expect(props["contact.email"]).toBe("ana@example.com");
    expect(props["contact.phone"]).toBe("11 2222 3333");
    expect(props["social.whatsapp"]).toBeUndefined();
    expect(props["social.instagram"]).toBe("https://instagram.com/club");
    expect(props["contact.address"]).toBe("Calle 1");
    expect(freeSiteNameProperties("Club Sur")["contact.email"]).toBeUndefined();
    expect(props["app.name"]).toBe("Club Sur");
    expect(props["app.tagline"]).toBe("Club Sur");
    expect(props["app.legal.registry"]).toBe("Club Sur");
  });
});
