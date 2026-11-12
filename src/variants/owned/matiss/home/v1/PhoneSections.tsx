import { MatissAgeFinder } from "@/variants/owned/matiss/age/v1/Web";
import { LandingMatissFooter } from "@/variants/owned/matiss/footer/v1/Web";
import { LandingMatissHero } from "@/variants/owned/matiss/hero/v1/Web";
import { LandingMatissManifesto } from "@/variants/owned/matiss/manifesto/v1/Web";
import { LandingMatissBenefits } from "@/variants/owned/matiss/benefits/v1/Web";
import { LandingMatissPrograms } from "@/variants/owned/matiss/programs/v1/Web";
import { LandingMatissClassDay } from "@/variants/owned/matiss/class-day/v1/Web";
import { LandingMatissFirstClass } from "@/variants/owned/matiss/first-class/v1/Web";
import { LandingMatissGala } from "@/variants/owned/matiss/gala/v1/Web";
import { LandingMatissGallery } from "@/variants/owned/matiss/gallery/v1/Web";
import { LandingMatissLocations } from "@/variants/owned/matiss/locations/v1/Web";
import { LandingMatissFaqPhone } from "@/variants/owned/matiss/faq-phone/v1/Web";
import { LandingMatissContact } from "@/variants/owned/matiss/contact/v1/Web";
import { buildMatissLanding, type LandingMatissSectionsProps } from "@/lib/landing/buildMatissLanding";

export function LandingMatissPhoneSections(props: LandingMatissSectionsProps) {
  const m = buildMatissLanding(props);

  return (
    <div className="matiss-phone-scroll">
      <div className="matiss-phone-screen matiss-phone-screen--hero"><LandingMatissHero {...m.hero} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--manifesto"><LandingMatissManifesto {...m.manifesto} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--benefits"><LandingMatissBenefits {...m.benefits} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--groups"><LandingMatissPrograms {...m.programs} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--age">
        <div id="horarios" className="bg-[var(--ds-color-muted)] px-[max(1.5rem,env(safe-area-inset-left))] py-4 pe-[max(1.5rem,env(safe-area-inset-right))]">
          <MatissAgeFinder {...m.age} />
        </div>
      </div>
      <div className="matiss-phone-screen matiss-phone-screen--classday"><LandingMatissClassDay {...m.classDay} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--first"><LandingMatissFirstClass {...m.firstClass} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--gala"><LandingMatissGala {...m.gala} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--gallery"><LandingMatissGallery {...m.gallery} layout="pages" /></div>
      <div className="matiss-phone-screen matiss-phone-screen--locations"><LandingMatissLocations {...m.locations} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--faq"><LandingMatissFaqPhone {...m.faq} /></div>
      <div className="matiss-phone-screen matiss-phone-screen--contact">
        <LandingMatissContact {...m.contact} />
        <LandingMatissFooter {...m.footer} />
      </div>
    </div>
  );
}
