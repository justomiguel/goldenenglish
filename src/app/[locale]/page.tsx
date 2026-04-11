import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { createClient } from "@/lib/supabase/server";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { LandingMainSections } from "@/components/organisms/LandingMainSections";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sessionEmail = user?.email ?? null;

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

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
