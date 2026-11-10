import { MatissAgeFinder } from "@/components/organisms/MatissAgeFinder";
import { LandingMatissFooter } from "@/components/organisms/LandingMatissFooter";
import { LandingMatissHero } from "@/components/organisms/LandingMatissHero";
import { LandingMatissManifesto } from "@/components/organisms/LandingMatissManifesto";
import { LandingMatissBenefits } from "@/components/organisms/LandingMatissBenefits";
import { LandingMatissPrograms } from "@/components/organisms/LandingMatissPrograms";
import { LandingMatissClassDay } from "@/components/organisms/LandingMatissClassDay";
import { LandingMatissFirstClass } from "@/components/organisms/LandingMatissFirstClass";
import { LandingMatissGala } from "@/components/organisms/LandingMatissGala";
import { LandingMatissGallery } from "@/components/organisms/LandingMatissGallery";
import { LandingMatissLocations } from "@/components/organisms/LandingMatissLocations";
import { LandingMatissFaqPhone } from "@/components/organisms/LandingMatissFaqPhone";
import { LandingMatissContact } from "@/components/organisms/LandingMatissContact";
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
        <div id="horarios" className="bg-[var(--matiss-lavender)] px-[max(1.5rem,env(safe-area-inset-left))] py-4 pe-[max(1.5rem,env(safe-area-inset-right))]">
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
