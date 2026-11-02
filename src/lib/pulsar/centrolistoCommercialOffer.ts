import type { PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";
import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

export type CommercialOfferStatus = "published" | "pending";

export interface MonthlyOffer {
  monthlyAmount: number;
  status: CommercialOfferStatus;
}

export interface SetupOffer {
  amount: number | null;
  kind: "amount" | "quote";
  status: CommercialOfferStatus;
}

const MONTHLY: Record<CentrolistoMarketCode, Record<PulsarSolutionSlug, number>> = {
  cl: { presencia: 0, gestion: 29990, ecosistema: 69990 },
  ar: { presencia: 0, gestion: 46400, ecosistema: 108400 },
  uy: { presencia: 0, gestion: 1210, ecosistema: 2830 },
  py: { presencia: 0, gestion: 180000, ecosistema: 419000 },
};

const CUSTOM_LANDING: Record<CentrolistoMarketCode, number> = {
  cl: 149990,
  ar: 232300,
  uy: 6070,
  py: 898000,
};

const CURRENCY: Record<CentrolistoMarketCode, string> = {
  cl: "CLP",
  ar: "ARS",
  uy: "UYU",
  py: "PYG",
};

const PRICE_LOCALE: Record<CentrolistoMarketCode, string> = {
  cl: "es-CL",
  ar: "es-AR",
  uy: "es-UY",
  py: "es-PY",
};

export function formatOfferAmount(amount: number, market: CentrolistoMarketCode): string {
  return new Intl.NumberFormat(PRICE_LOCALE[market], {
    style: "currency",
    currency: CURRENCY[market],
    maximumFractionDigits: 0,
  }).format(amount);
}

export function publishedMonthlyAmount(
  slug: PulsarSolutionSlug,
  market: CentrolistoMarketCode = "cl",
): number {
  return MONTHLY[market][slug];
}

export function customLandingAmount(market: CentrolistoMarketCode = "cl"): number {
  return CUSTOM_LANDING[market];
}

export function publishedSetupOffer(
  id: string,
  market: CentrolistoMarketCode = "cl",
): SetupOffer | null {
  if (id === "presenciaSelfServe" || id === "gestionSelfServe") {
    return { amount: 0, kind: "amount", status: "published" };
  }
  if (id === "customLanding") {
    return { amount: CUSTOM_LANDING[market], kind: "amount", status: "published" };
  }
  if (id === "special") {
    return { amount: null, kind: "quote", status: "published" };
  }
  return null;
}
