import { describe, expect, it } from "vitest";
import { centrolistoOrganizationLd } from "@/components/organisms/pulsar/CentroListoJsonLd";

describe("centrolistoOrganizationLd", () => {
  it("names the organization and points the logo at the sage mark", () => {
    expect(
      centrolistoOrganizationLd({
        name: "centrolisto",
        description: "Un lugar propio para tu escuela.",
        url: "https://centrolisto.cl/es",
        logoUrl: "https://centrolisto.cl/centrolisto/android-chrome-512x512.png",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "centrolisto",
      description: "Un lugar propio para tu escuela.",
      url: "https://centrolisto.cl/es",
      logo: "https://centrolisto.cl/centrolisto/android-chrome-512x512.png",
    });
  });
});
