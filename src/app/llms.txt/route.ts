import { NextResponse } from "next/server";
import { getDictionary, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { buildCentrolistoLlmsTxt } from "@/lib/pulsar/centrolistoLlmsTxt";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

const PAGE_SUFFIXES = ["", "/producto", "/clientes", "/contacto"] as const;

export async function GET() {
  if (!(await isPulsarPlatformRequest())) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const origin = (await getRequestPublicSiteUrl())?.origin ?? "https://centrolisto.cl";
  const dictionaries = await Promise.all(locales.map((locale) => getDictionary(locale)));
  const es = dictionaries[locales.indexOf("es")];
  const body = buildCentrolistoLlmsTxt({
    origin,
    name: es.pulsar.meta.brandName,
    tagline: es.pulsar.meta.brandTagline,
    description: es.pulsar.meta.description,
    locales: dictionaries.map((dict, index) => ({
      code: locales[index] as AppLocale,
      pages: [
        { path: PAGE_SUFFIXES[0], title: dict.pulsar.nav.home },
        { path: PAGE_SUFFIXES[1], title: dict.pulsar.meta.productoTitle },
        { path: PAGE_SUFFIXES[2], title: dict.pulsar.meta.clientesTitle },
        { path: PAGE_SUFFIXES[3], title: dict.pulsar.meta.contactoTitle },
      ],
    })),
    faqs: es.pulsar.contact.faqs,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      Vary: "Host",
    },
  });
}
