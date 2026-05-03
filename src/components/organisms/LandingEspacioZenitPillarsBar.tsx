import {
  Shirt,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";

export interface LandingEspacioZenitPillarsBarProps {
  dict: Dictionary;
}

const ICON_STROKE = 1.5;

export function LandingEspacioZenitPillarsBar({
  dict,
}: LandingEspacioZenitPillarsBarProps) {
  const brand = "ez" as const;
  const items = [
    {
      Icon: Users,
      label: marketingLandingCopy(dict, brand, "pillars.professors"),
    },
    {
      Icon: Shield,
      label: marketingLandingCopy(dict, brand, "pillars.safe"),
    },
    {
      Icon: Shirt,
      label: marketingLandingCopy(dict, brand, "pillars.formation"),
    },
    {
      Icon: Sparkles,
      label: marketingLandingCopy(dict, brand, "pillars.shows"),
    },
  ];

  return (
    <section
      className="relative z-[9] border-y border-[rgb(0_174_239_/22%)] bg-black py-12 md:py-14"
      aria-labelledby="ez-mock-pillars-heading"
    >
      <h2 id="ez-mock-pillars-heading" className="sr-only">
        {marketingLandingCopy(dict, brand, "pillars.sectionTitle")}
      </h2>
      <div className="mx-auto grid max-w-6xl gap-8 px-[max(1rem,env(safe-area-inset-left))] sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:px-6">
        {items.map(({ Icon, label }) => (
          <MozarthitosReveal key={label} preset="sedesIntro">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="ez-mock-pillar-ring inline-flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[var(--ez-cyan)] bg-black text-[var(--ez-cyan)] shadow-[0_0_28px_rgb(0_174_239_/22%)] md:h-[80px] md:w-[80px]">
                <Icon className="h-9 w-9 md:h-10 md:w-10" aria-hidden strokeWidth={ICON_STROKE} />
              </span>
              <p className="max-w-[14rem] text-xs font-bold uppercase leading-snug tracking-[0.12em] text-white md:text-[13px]">
                {label}
              </p>
            </div>
          </MozarthitosReveal>
        ))}
      </div>
    </section>
  );
}
