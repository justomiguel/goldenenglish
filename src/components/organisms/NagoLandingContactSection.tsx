import type { Dictionary } from "@/types/i18n";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";

interface NagoLandingContactSectionProps {
  dict: Dictionary;
  locale: string;
}

export function NagoLandingContactSection({
  dict,
  locale,
}: NagoLandingContactSectionProps) {
  const pc = dict.publicContact;
  return (
    <section
      id="contacto"
      className="scroll-mt-24 bg-[var(--nago-footer)] px-[max(1.5rem,env(safe-area-inset-left))] py-14 pe-[max(1.5rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] text-white md:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center font-[family-name:var(--font-nago-display)] text-3xl font-bold uppercase text-[var(--nago-yellow)] md:text-4xl">
          {pc.title}
        </h2>
        <p className="mx-auto mt-4 text-center text-sm text-white/88 md:text-base">{pc.lead}</p>
        <div className="mt-8 rounded-2xl border border-white/18 bg-[var(--color-surface)] p-6 text-[var(--color-foreground)] shadow-lg md:p-8">
          <PublicContactForm locale={locale} labels={pc} embedded />
        </div>
      </div>
    </section>
  );
}
