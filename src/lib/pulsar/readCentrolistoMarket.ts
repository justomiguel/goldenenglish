import { cookies } from "next/headers";
import {
  CENTROLISTO_MARKET_COOKIE,
  resolveCentrolistoMarket,
  type CentrolistoMarketCode,
} from "@/lib/pulsar/centrolistoMarket";

export async function readCentrolistoMarket(searchParams: {
  pais?: string | string[];
} | undefined): Promise<CentrolistoMarketCode> {
  const jar = await cookies();
  return resolveCentrolistoMarket({
    query: searchParams?.pais,
    cookie: jar.get(CENTROLISTO_MARKET_COOKIE)?.value,
  });
}
