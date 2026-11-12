import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { MatissSeal } from "@/variants/owned/matiss/seal/v1/Web";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";

export interface LandingMatissContactProps {
  locale: string;
  dict: Dictionary;
  title: string;
  subtitle: string;
  photoSrc: string;
  photoAlt: string;
  whatsappHref?: string;
  primaryHref?: string;
  primaryLabel: string;
  sealRing: string;
  logoSrc: string;
}

export function LandingMatissContact({
  locale,
  dict,
  title,
  subtitle,
  photoSrc,
  photoAlt,
  whatsappHref,
  primaryHref,
  primaryLabel,
  sealRing,
  logoSrc,
}: LandingMatissContactProps) {
  return (
    <section id="contacto" className="scroll-mt-24 bg-[var(--ds-color-muted)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
      <div className="mx-auto grid max-w-6xl items-start gap-10 md:grid-cols-2">
        <Image
          src={photoSrc}
          alt={photoAlt}
          width={864}
          height={1152}
          className="aspect-[4/5] w-full rounded-[40px] object-cover object-top md:sticky md:top-24"
        />
        <div>
          <div className="flex items-start justify-between gap-6">
            <h2 className="matiss-display text-4xl text-[var(--ds-color-foreground)] md:text-5xl">{title}</h2>
            <MatissSeal ring={sealRing} logoSrc={logoSrc} size="sm" reverse className="hidden shrink-0 sm:block" />
          </div>
          <p className="mt-4 max-w-xl text-[var(--ds-color-muted-foreground)]">{subtitle}</p>
          <div className="mt-6 rounded-3xl bg-white p-6">
            <PublicContactForm locale={locale} labels={dict.publicContact} embedded />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {primaryHref ? (
              <Link href={primaryHref} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--ds-color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--owned-violet-hover)]">
                <Sparkles className="h-4 w-4" aria-hidden />
                {primaryLabel}
              </Link>
            ) : null}
            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[var(--owned-rose)] px-6 text-sm font-semibold text-[var(--owned-rose)] hover:bg-white">
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingMatissContact;
