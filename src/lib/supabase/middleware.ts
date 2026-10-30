import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabasePublicEnv, readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { readPulsarSupabasePublicEnv } from "@/lib/supabase/pulsar";
import {
  GE_TENANT_HEADER,
  isPulsarRequestFromHeaderGet,
  PULSAR_SLUG,
  tenantFromHeaderGet,
} from "@/lib/tenant/tenantRegistry";
import { mustRedirectToResetPassword } from "@/lib/supabase/mustRedirectToResetPassword";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import {
  GE_PULSAR_THEME_SLUG_HEADER,
  pulsarThemeSlugFromPath,
} from "@/lib/pulsar/pulsarThemeSlugHeader";

export type UpdateSessionResult = {
  response: NextResponse;
  userId: string | null;
};

function extractLocaleFromPathname(pathname: string): string {
  const m = pathname.match(/^\/([^/]+)(?:\/|$)/);
  const candidate = m?.[1];
  if (candidate && (locales as readonly string[]).includes(candidate)) {
    return candidate;
  }
  return defaultLocale;
}

function nextWithLocaleHeader(request: NextRequest, tenantSlug: string | null): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(GE_REQUEST_LOCALE_HEADER, extractLocaleFromPathname(request.nextUrl.pathname));
  if (tenantSlug) headers.set(GE_TENANT_HEADER, tenantSlug);
  const themeSlug = pulsarThemeSlugFromPath(request.nextUrl.pathname);
  if (themeSlug) headers.set(GE_PULSAR_THEME_SLUG_HEADER, themeSlug);
  return NextResponse.next({ request: { headers } });
}

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  const isPulsar = isPulsarRequestFromHeaderGet((name) => request.headers.get(name));
  if (isPulsar) {
    const { url, anonKey } = readPulsarSupabasePublicEnv();
    if (!url || !anonKey) {
      return { response: nextWithLocaleHeader(request, PULSAR_SLUG), userId: null };
    }
    let pulsarResponse = nextWithLocaleHeader(request, PULSAR_SLUG);
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pulsarResponse = nextWithLocaleHeader(request, PULSAR_SLUG);
          cookiesToSet.forEach(({ name, value, options }) =>
            pulsarResponse.cookies.set(name, value, options),
          );
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response: pulsarResponse, userId: user?.id ?? null };
  }

  const tenant = tenantFromHeaderGet((name) => request.headers.get(name));
  const env = readSupabasePublicEnv();
  const url = tenant?.supabaseUrl ?? env.url;
  const anonKey = tenant?.supabaseAnonKey ?? env.anonKey;

  if (!url || !anonKey) {
    if (!hasSupabasePublicEnv() && process.env.NODE_ENV === "development") {
      console.warn(
        "[supabase] Missing URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example). Session refresh skipped.",
      );
    }
    return { response: nextWithLocaleHeader(request, tenant?.slug ?? null), userId: null };
  }

  let supabaseResponse = nextWithLocaleHeader(request, tenant?.slug ?? null);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = nextWithLocaleHeader(request, tenant?.slug ?? null);
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (mustRedirectToResetPassword(user, request.nextUrl.pathname)) {
    const locale = extractLocaleFromPathname(request.nextUrl.pathname);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/reset-password`;
    redirectUrl.search = "";
    return {
      response: NextResponse.redirect(redirectUrl),
      userId: user?.id ?? null,
    };
  }

  return { response: supabaseResponse, userId: user?.id ?? null };
}
