import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { LandingMainSections } from "@/components/organisms/LandingMainSections";

/** Session and `isAdmin` must reflect cookies each request (avoid stale static HTML). */
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sessionEmail = user?.email ?? null;

  const isAdmin =
    user != null ? await resolveIsAdminSession(supabase, user.id) : false;

  const [dict, brand, inscriptionsOpen] = await Promise.all([
    getDictionary(locale),
    Promise.resolve(getBrandPublic()),
    getInscriptionsEnabled(),
  ]);

  const main = (
    <LandingMainSections
      dict={dict}
      brand={brand}
      locale={locale}
      sessionEmail={sessionEmail}
      inscriptionsOpen={inscriptionsOpen}
    />
  );

  return (
    <LandingSurfaceGate
      desktop={
        <LandingScreenDesktop
          brand={brand}
          dict={dict}
          locale={locale}
          sessionEmail={sessionEmail}
          isAdmin={isAdmin}
        >
          {main}
        </LandingScreenDesktop>
      }
      main={main}
      brand={brand}
      dict={dict}
      locale={locale}
      sessionEmail={sessionEmail}
      isAdmin={isAdmin}
    />
  );
}
