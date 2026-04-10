import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";
import type { AppLocale } from "@/lib/i18n/dictionaries";

function getLocale(request: NextRequest): AppLocale {
  const header = request.headers.get("accept-language");
  const acceptLang = header == null ? "" : header.trim();
  const comma = acceptLang.indexOf(",");
  const firstRaw = comma === -1 ? acceptLang : acceptLang.slice(0, comma);
  const firstSegment = firstRaw.trim();
  const dash = firstSegment.indexOf("-");
  const preferred = (
    dash === -1 ? firstSegment : firstSegment.slice(0, dash)
  ).toLowerCase();
  for (const l of locales) {
    if (l === preferred) return l;
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  );

  if (!hasLocale) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon_io/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
