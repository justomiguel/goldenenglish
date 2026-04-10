import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { createClient } from "@/lib/supabase/server";
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

  const [dict, brand] = await Promise.all([
    getDictionary(locale),
    Promise.resolve(getBrandPublic()),
  ]);

  const main = (
    <LandingMainSections
      dict={dict}
      brand={brand}
      locale={locale}
      sessionEmail={sessionEmail}
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
        >
          {main}
        </LandingScreenDesktop>
      }
      main={main}
      brand={brand}
      dict={dict}
      locale={locale}
      sessionEmail={sessionEmail}
    />
  );
}
