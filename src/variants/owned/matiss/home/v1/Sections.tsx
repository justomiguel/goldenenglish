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
import { LandingMatissFaq } from "@/variants/owned/matiss/faq/v1/Web";
import { LandingMatissContact } from "@/variants/owned/matiss/contact/v1/Web";
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
        <div id="horarios" className="mt-20 scroll-mt-24 rounded-[40px] bg-[var(--ds-color-muted)] p-6 md:p-12">
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
