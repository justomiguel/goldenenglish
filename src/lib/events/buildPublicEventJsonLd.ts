import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import { resolveEventPublicPriceDisplay } from "@/lib/events/resolveEventPublicPriceDisplay";

const IN_STOCK = "https://schema.org/InStock";

export interface PublicEventJsonLdInput {
  name: string;
  description: string;
  startDate: string;
  location: string | null;
  coverImageUrl: string | null;
  /** Public origin without a path. Null keeps a relative cover path. */
  publicOrigin: string | null;
  currency: string;
  price: number | null;
  priceLocal: number | null;
  priceNonLocal: number | null;
  priceByFlow: boolean;
  flowPrices: ReadonlyArray<number | null>;
  packagePrices: ReadonlyArray<number>;
  brandName: string;
  brandUrl: string;
  contactAddress: string | null;
  offerUrl: string;
}

export interface PublicEventJsonLd {
  "@context": "https://schema.org";
  "@type": "Event";
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode";
  eventStatus: "https://schema.org/EventScheduled";
  image?: string;
  location: { "@type": "Place"; name: string; address?: string };
  organizer: { "@type": "Organization"; name: string; url?: string; address?: string };
  performer: { "@type": "PerformingGroup"; name: string };
  offers:
    | {
        "@type": "Offer";
        price: string;
        priceCurrency: string;
        availability: typeof IN_STOCK;
        url: string;
      }
    | {
        "@type": "AggregateOffer";
        lowPrice: string;
        highPrice: string;
        offerCount: number;
        priceCurrency: string;
        availability: typeof IN_STOCK;
        url: string;
      };
}

/** Decimal string without a trailing .00. CLP stays a whole number. */
function schemaPrice(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  const rounded = Math.round(amount * 100) / 100;
  return String(rounded);
}

function finitePrices(values: ReadonlyArray<number | null>, minExclusiveZero: boolean): number[] {
  return values.filter(
    (value): value is number =>
      value != null && Number.isFinite(value) && (minExclusiveZero ? value > 0 : value >= 0),
  );
}

function absoluteUrl(origin: string | null, value: string): string {
  const trimmed = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  if (!origin) return trimmed;
  const base = origin.replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

function priceSource(input: PublicEventJsonLdInput): EventPriceSource {
  return { price: input.price, priceLocal: input.priceLocal, priceNonLocal: input.priceNonLocal };
}

function offerPrices(input: PublicEventJsonLdInput): { prices: number[]; aggregate: boolean } {
  const packages = finitePrices(input.packagePrices, true);
  if (packages.length > 0) return { prices: packages, aggregate: true };

  if (input.priceByFlow) {
    const flows = finitePrices(input.flowPrices, false);
    if (flows.length > 0) return { prices: flows, aggregate: true };
  }

  const display = resolveEventPublicPriceDisplay(priceSource(input), input.currency);
  if (display.kind === "tiered") {
    return { prices: [display.localAmount, display.nonLocalAmount], aggregate: true };
  }
  if (display.kind === "single") return { prices: [display.amount], aggregate: false };
  if (display.kind === "packages") {
    return { prices: display.packages.map((row) => row.price), aggregate: true };
  }
  return { prices: [0], aggregate: false };
}

/**
 * Event JSON-LD for the public event page.
 * `endDate` matches `startDate` because the row stores one instant.
 * `performer` is the host brand. There is no guest-performer column.
 */
export function buildPublicEventJsonLd(input: PublicEventJsonLdInput): PublicEventJsonLd {
  const venue = input.location?.trim() ?? "";
  const brandAddress = input.contactAddress?.trim() ?? "";
  const address = venue || brandAddress;
  const registerUrl = absoluteUrl(input.publicOrigin, input.offerUrl);
  const image = input.coverImageUrl?.trim()
    ? absoluteUrl(input.publicOrigin, input.coverImageUrl)
    : "";
  const priced = offerPrices(input);
  const sorted = [...priced.prices].sort((left, right) => left - right);
  const brandUrl = input.brandUrl.trim().replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.startDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    ...(image ? { image } : {}),
    location: {
      "@type": "Place",
      name: venue || input.brandName,
      ...(address ? { address } : {}),
    },
    organizer: {
      "@type": "Organization",
      name: input.brandName,
      ...(brandUrl ? { url: brandUrl } : {}),
      ...(brandAddress ? { address: brandAddress } : {}),
    },
    performer: {
      "@type": "PerformingGroup",
      name: input.brandName,
    },
    offers: priced.aggregate
      ? {
          "@type": "AggregateOffer",
          lowPrice: schemaPrice(sorted[0] ?? 0),
          highPrice: schemaPrice(sorted[sorted.length - 1] ?? 0),
          offerCount: priced.prices.length,
          priceCurrency: input.currency,
          availability: IN_STOCK,
          url: registerUrl,
        }
      : {
          "@type": "Offer",
          price: schemaPrice(sorted[0] ?? 0),
          priceCurrency: input.currency,
          availability: IN_STOCK,
          url: registerUrl,
        },
  };
}
