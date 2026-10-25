import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { MiMundoRegisterHeader } from "@/components/molecules/MiMundoRegisterHeader";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";

export interface PublicContactScreenMiMundoProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
}

export function PublicContactScreenMiMundo({
  locale,
  dict,
  brand,
  sessionEmail = null,
}: PublicContactScreenMiMundoProps) {
  const pc = dict.publicContact;
  return (
    <MiMundoFontRoot className="relative min-h-screen bg-[var(--mm-cream)]">
      <MiMundoRegisterHeader
        locale={locale}
        logoSrc={brand.logoPath.trim()}
        logoAlt={brand.logoAlt || brand.name}
        dict={dict}
        sessionEmail={sessionEmail}
      />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <header className="text-center">
          <h1 className="font-[family-name:var(--font-mm-display)] text-3xl font-semibold text-[var(--mm-green-dark)]">
            {pc.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--mm-green-dark)]">{pc.lead}</p>
        </header>
        <div className="mt-8 rounded-[var(--layout-border-radius)] border border-[var(--mm-green)]/25 bg-white p-6">
          <PublicContactForm locale={locale} labels={pc} />
        </div>
      </main>
    </MiMundoFontRoot>
  );
}
