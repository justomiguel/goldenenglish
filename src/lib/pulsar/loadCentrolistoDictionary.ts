import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";
import { applyCentrolistoMarketDictionary } from "@/lib/pulsar/applyCentrolistoMarketDictionary";
import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { readCentrolistoMarket } from "@/lib/pulsar/readCentrolistoMarket";

export async function loadCentrolistoDictionary(
  locale: string,
  searchParams?: { pais?: string | string[] },
): Promise<{ dict: Dictionary; market: CentrolistoMarketCode }> {
  const market = await readCentrolistoMarket(searchParams);
  const dict = applyCentrolistoMarketDictionary(await getDictionary(locale), locale, market);
  return { dict, market };
}
