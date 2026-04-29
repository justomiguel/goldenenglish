import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabasePublicEnv, readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { mustRedirectToResetPassword } from "@/lib/supabase/mustRedirectToResetPassword";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";

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

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  if (!hasSupabasePublicEnv()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[supabase] Missing URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example). Session refresh skipped.",
      );
    }
    return { response: NextResponse.next({ request }), userId: null };
  }

  const { url, anonKey } = readSupabasePublicEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
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
