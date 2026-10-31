import type { PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

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

/** Chile commercial presentation. Billing does not read this module. */
export const CENTROLISTO_COMMERCIAL_OFFER = {
  market: "CL",
  currency: "CLP",
  solutions: {
    presencia: { monthlyAmount: 0, status: "published" },
    gestion: { monthlyAmount: 29990, status: "published" },
    ecosistema: { monthlyAmount: 69990, status: "published" },
  } satisfies Record<PulsarSolutionSlug, MonthlyOffer>,
  setup: {
    presenciaSelfServe: { amount: 0, kind: "amount", status: "published" },
    presenciaCustom: { amount: null, kind: "quote", status: "published" },
    gestionSelfServe: { amount: 0, kind: "amount", status: "published" },
    gestionAssisted: { amount: 49990, kind: "amount", status: "published" },
    ecosistemaAssisted: { amount: 149990, kind: "amount", status: "published" },
    special: { amount: null, kind: "quote", status: "published" },
  } satisfies Record<string, SetupOffer>,
  pending: {
    argentina: {
      status: "pending" as const,
      currency: "ARS" as const,
      gestionMonthly: 44900,
      ecosistemaMonthly: 99900,
    },
    activeStudentCap: {
      status: "pending" as const,
      gestion: 120,
      ecosistema: 300,
    },
  },
};

const PRICE_LOCALE: Record<string, string> = {
  es: "es-CL",
  en: "es-CL",
  pt: "es-CL",
};

export function formatOfferAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(PRICE_LOCALE[locale] ?? "es-CL", {
    style: "currency",
    currency: CENTROLISTO_COMMERCIAL_OFFER.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function publishedMonthlyAmount(slug: PulsarSolutionSlug): number {
  const offer = CENTROLISTO_COMMERCIAL_OFFER.solutions[slug];
  if (offer.status !== "published") return 0;
  return offer.monthlyAmount;
}
