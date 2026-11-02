import type { Dictionary } from "@/types/i18n";
import esAr from "@/dictionaries/pulsar/es-ar.json";
import esCl from "@/dictionaries/pulsar/es-cl.json";
import esPy from "@/dictionaries/pulsar/es-py.json";
import esUy from "@/dictionaries/pulsar/es-uy.json";
import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { mergeCentrolistoCopy } from "@/lib/pulsar/mergeCentrolistoCopy";

function overlayFor(market: CentrolistoMarketCode): unknown {
  if (market === "ar") return esAr;
  if (market === "uy") return mergeCentrolistoCopy(esAr, esUy);
  if (market === "py") return esPy;
  return esCl;
}

function hasKeys(value: unknown): boolean {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}

/** Spanish marketing copy follows the price country. Other locales stay as written. */
export function applyCentrolistoMarketDictionary(
  dict: Dictionary,
  locale: string,
  market: CentrolistoMarketCode,
): Dictionary {
  if (locale !== "es") return dict;
  const overlay = overlayFor(market);
  if (!hasKeys(overlay)) return dict;
  return {
    ...dict,
    pulsar: mergeCentrolistoCopy(dict.pulsar, overlay),
  };
}
