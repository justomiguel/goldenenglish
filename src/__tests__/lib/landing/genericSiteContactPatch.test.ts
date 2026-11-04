import { describe, expect, it } from "vitest";
import { genericSiteContactPatch } from "@/lib/landing/genericSiteContactPatch";

describe("genericSiteContactPatch", () => {
  it("stores a phone, a WhatsApp link, an Instagram link, and an address", () => {
    const result = genericSiteContactPatch({
      email: "club@example.com",
      phone: "+56 9 1111 2222",
      address: "  Calle 1  ",
      whatsapp: "+56 9 1111 2222",
      instagram: "@club",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patch["contact.email"]).toBe("club@example.com");
    expect(result.patch["contact.phone"]).toBe("+56 9 1111 2222");
    expect(result.patch["contact.address"]).toBe("Calle 1");
    expect(result.patch["social.whatsapp"]).toBe("https://wa.me/56911112222");
    expect(result.patch["social.instagram"]).toBe("https://instagram.com/club");
  });

  it("clears a blank field and rejects a bad WhatsApp value", () => {
    const cleared = genericSiteContactPatch({
      email: "",
      phone: "",
      address: "",
      whatsapp: "",
      instagram: "",
    });
    expect(cleared).toEqual({
      ok: true,
      patch: {
        "contact.email": "",
        "contact.phone": "",
        "contact.address": "",
        "social.whatsapp": "",
        "social.instagram": "",
      },
    });
    expect(
      genericSiteContactPatch({ email: "no", phone: "", address: "", whatsapp: "", instagram: "" }),
    ).toEqual({ ok: false, errorCode: "email" });
    expect(
      genericSiteContactPatch({ email: "", phone: "", address: "", whatsapp: "no", instagram: "" }),
    ).toEqual({ ok: false, errorCode: "whatsapp" });
  });
});
