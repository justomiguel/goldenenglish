import { describe, expect, it } from "vitest";
import { buildPublicEventJsonLd, type PublicEventJsonLdInput } from "@/lib/events/buildPublicEventJsonLd";

// REGRESSION CHECK: Offline Event JSON-LD must keep location, endDate, organizer, offers, and performer.

function input(overrides: Partial<PublicEventJsonLdInput> = {}): PublicEventJsonLdInput {
  return {
    name: "Recital",
    description: "Una noche de música.",
    startDate: "2026-12-01T21:00:00.000Z",
    location: "Sala 1",
    coverImageUrl: null,
    publicOrigin: "https://liorastudio.cl",
    currency: "CLP",
    price: 30000,
    priceLocal: null,
    priceNonLocal: null,
    priceByFlow: false,
    flowPrices: [],
    packagePrices: [],
    brandName: "Liora Studio",
    brandUrl: "https://liorastudio.cl",
    contactAddress: "Av. Principal 10",
    offerUrl: "https://liorastudio.cl/es/events/recital/register",
    ...overrides,
  };
}

describe("buildPublicEventJsonLd", () => {
  it("emits a Place, the same end instant, the host, and a single price", () => {
    const ld = buildPublicEventJsonLd(input());
    expect(ld["@type"]).toBe("Event");
    expect(ld.endDate).toBe("2026-12-01T21:00:00.000Z");
    expect(ld.location).toEqual({
      "@type": "Place",
      name: "Sala 1",
      address: "Sala 1",
    });
    expect(ld.organizer).toEqual({
      "@type": "Organization",
      name: "Liora Studio",
      url: "https://liorastudio.cl",
      address: "Av. Principal 10",
    });
    expect(ld.performer).toEqual({ "@type": "PerformingGroup", name: "Liora Studio" });
    expect(ld.offers).toMatchObject({
      "@type": "Offer",
      price: "30000",
      priceCurrency: "CLP",
      url: "https://liorastudio.cl/es/events/recital/register",
    });
  });

  it("uses the brand name and address when the event location is empty", () => {
    const ld = buildPublicEventJsonLd(input({ location: "  ", price: 0 }));
    expect(ld.location).toEqual({
      "@type": "Place",
      name: "Liora Studio",
      address: "Av. Principal 10",
    });
    expect(ld.offers).toMatchObject({ "@type": "Offer", price: "0" });
  });

  it("omits the address when neither the event nor the brand has one", () => {
    const ld = buildPublicEventJsonLd(input({ location: null, contactAddress: "" }));
    expect(ld.location).toEqual({ "@type": "Place", name: "Liora Studio" });
    expect(ld.organizer).not.toHaveProperty("address");
  });

  it("keeps a decimal price and skips a trailing .00", () => {
    const ld = buildPublicEventJsonLd(input({ price: 30.5 }));
    expect(ld.offers).toMatchObject({ price: "30.5" });
  });

  it("builds an aggregate offer for local and non-local prices", () => {
    const ld = buildPublicEventJsonLd(
      input({ price: null, priceLocal: 20000, priceNonLocal: 35000 }),
    );
    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "20000",
      highPrice: "35000",
      offerCount: 2,
    });
  });

  it("builds an aggregate offer from package prices", () => {
    const ld = buildPublicEventJsonLd(
      input({ price: 999, packagePrices: [15000, 40000, 0] }),
    );
    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "15000",
      highPrice: "40000",
      offerCount: 2,
    });
  });

  it("builds an aggregate offer from flow prices", () => {
    const ld = buildPublicEventJsonLd(
      input({ price: 10, priceByFlow: true, flowPrices: [null, 12000, 18000] }),
    );
    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "12000",
      highPrice: "18000",
      offerCount: 2,
    });
  });

  it("makes a relative cover absolute and keeps an absolute cover", () => {
    expect(buildPublicEventJsonLd(input({ coverImageUrl: "/covers/a.jpg" })).image).toBe(
      "https://liorastudio.cl/covers/a.jpg",
    );
    expect(
      buildPublicEventJsonLd(input({ coverImageUrl: "https://cdn.example/a.jpg" })).image,
    ).toBe("https://cdn.example/a.jpg");
    expect(buildPublicEventJsonLd(input()).image).toBeUndefined();
  });
});
