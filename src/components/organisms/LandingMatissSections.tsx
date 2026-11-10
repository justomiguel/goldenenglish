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
import { LandingMatissFaq } from "@/components/organisms/LandingMatissFaq";
import { LandingMatissContact } from "@/components/organisms/LandingMatissContact";
import { buildMatissLanding, type LandingMatissSectionsProps } from "@/lib/landing/buildMatissLanding";

export type { LandingMatissImages, LandingMatissSectionsProps } from "@/lib/landing/buildMatissLanding";

export function LandingMatissSections(props: LandingMatissSectionsProps) {
  const m = buildMatissLanding(props);

  return (
    <>
      <LandingMatissHero {...m.hero} />
      <LandingMatissManifesto {...m.manifesto} />
      <LandingMatissBenefits {...m.benefits} />
      <LandingMatissPrograms {...m.programs}>
        <div id="horarios" className="mt-20 scroll-mt-24 rounded-[40px] bg-[var(--matiss-lavender)] p-6 md:p-12">
          <MatissAgeFinder {...m.age} />
        </div>
      </LandingMatissPrograms>
      <LandingMatissClassDay {...m.classDay} />
      <LandingMatissFirstClass {...m.firstClass} />
      <LandingMatissGala {...m.gala} />
      <LandingMatissGallery {...m.gallery} />
      <LandingMatissLocations {...m.locations} />
      <LandingMatissFaq {...m.faq} />
      <LandingMatissContact {...m.contact} />
      <LandingMatissFooter {...m.footer} />
    </>
  );
}
