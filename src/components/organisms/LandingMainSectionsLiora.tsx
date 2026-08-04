import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { LioraSiteHeader } from "@/components/organisms/LioraSiteHeader";
import { LandingLioraSections } from "@/components/organisms/LandingLioraSections";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";

interface LandingMainSectionsLioraProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
}

export function LandingMainSectionsLiora({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  blogEnabled = false,
}: LandingMainSectionsLioraProps) {
  return (
    <LioraFontRoot>
      <main className="relative overflow-x-hidden">
        <LioraSiteHeader
          locale={locale}
          logoSrc={brand.logoPath}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? dict.blog.list.title : undefined}
          showEventsLink
          eventsLabel={marketingLandingCopy(dict, "liora", "nav.eventos")}
          instagramUrl={brand.socialInstagram}
          whatsappUrl={brand.socialWhatsapp}
          labels={{
            inicio: marketingLandingCopy(dict, "liora", "nav.inicio"),
            sobreNosotros: marketingLandingCopy(dict, "liora", "nav.sobreNosotros"),
            clases: marketingLandingCopy(dict, "liora", "nav.clases"),
            sedes: marketingLandingCopy(dict, "liora", "nav.sedes"),
            horarios: marketingLandingCopy(dict, "liora", "nav.horarios"),
            galeria: marketingLandingCopy(dict, "liora", "nav.galeria"),
            eventos: marketingLandingCopy(dict, "liora", "nav.eventos"),
            contacto: marketingLandingCopy(dict, "liora", "nav.contacto"),
            openMenu: marketingLandingCopy(dict, "liora", "chrome.openMenu"),
            closeMenu: marketingLandingCopy(dict, "liora", "chrome.closeMenu"),
          }}
        />
        <LandingLioraSections
          dict={dict}
          brand={brand}
          locale={locale}
          mediaMap={mediaMap}
        />
      </main>
    </LioraFontRoot>
  );
}
