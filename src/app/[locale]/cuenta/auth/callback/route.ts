import { NextResponse } from "next/server";
import { resolvePulsarPostLoginPath } from "@/app/[locale]/admin/sessionActions";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import { createPulsarServerClient } from "@/lib/supabase/pulsar";

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createPulsarServerClient();
      const exchanged = await supabase.auth.exchangeCodeForSession(code);
      if (exchanged.error) {
        logServerActionException("pulsarAuthCallback", exchanged.error);
      }
    } catch (err) {
      logServerActionException("pulsarAuthCallback", err);
    }
  }
  const path = await resolvePulsarPostLoginPath(locale, url.searchParams.get("next"));
  return NextResponse.redirect(new URL(path, url.origin));
}
