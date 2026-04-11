import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList } from "lucide-react";

export interface LandingHeroInscriptionCtaProps {
  href: string;
  label: string;
  /** Inscripción pública vs. usuario ya autenticado (navegar a niveles). */
  mode: "register" | "signedIn";
}

/**
 * CTA principal del hero: relieve, sombras apiladas e iconos (inscripción / niveles).
 */
export function LandingHeroInscriptionCta({
  href,
  label,
  mode,
}: LandingHeroInscriptionCtaProps) {
  const LeadIcon = mode === "register" ? ClipboardList : BookOpen;

  return (
    <Link
      href={href}
      className="group/cta relative inline-flex max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary-dark)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-[calc(var(--layout-border-radius)+8px)] bg-[var(--color-accent)]/35 blur-lg opacity-70 transition-opacity duration-500 group-hover/cta:opacity-100"
      />
      <span
        className="relative flex min-h-[3.25rem] w-full min-w-[min(100%,17.5rem)] max-w-[22rem] items-stretch overflow-hidden rounded-[var(--layout-border-radius)] border border-[color-mix(in_srgb,var(--color-accent)_55%,white)] bg-gradient-to-b from-[var(--color-accent)] to-[color-mix(in_srgb,var(--color-accent)_80%,var(--color-accent-foreground))] text-[var(--color-accent-foreground)] shadow-[0_10px_0_0_color-mix(in_srgb,var(--color-accent-foreground)_22%,transparent),0_3px_0_0_color-mix(in_srgb,var(--color-accent-foreground)_12%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.5),inset_0_-3px_0_0_color-mix(in_srgb,var(--color-accent-foreground)_14%,transparent),0_18px_44px_-12px_color-mix(in_srgb,var(--color-primary-dark)_55%,transparent)] transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_0_0_color-mix(in_srgb,var(--color-accent-foreground)_24%,transparent),0_18px_48px_-10px_color-mix(in_srgb,var(--color-primary-dark)_60%,transparent)] motion-safe:active:translate-y-0.5 motion-safe:active:shadow-[0_6px_0_0_color-mix(in_srgb,var(--color-accent-foreground)_18%,transparent),0_12px_32px_-12px_color-mix(in_srgb,var(--color-primary-dark)_50%,transparent)]"
      >
        <span
          aria-hidden
          className="flex w-[3.35rem] shrink-0 items-center justify-center bg-[color-mix(in_srgb,var(--color-accent-foreground)_9%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        >
          <LeadIcon
            className="h-7 w-7 shrink-0 text-[var(--color-accent-foreground)] drop-shadow-sm"
            strokeWidth={2}
            aria-hidden
          />
        </span>
        <span className="flex min-w-0 flex-1 items-center px-3 py-2 text-left text-sm font-semibold leading-snug tracking-tight sm:text-base">
          {label}
        </span>
        <span
          aria-hidden
          className="flex w-[3.1rem] shrink-0 items-center justify-center bg-[color-mix(in_srgb,var(--color-accent-foreground)_11%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
        >
          <ArrowRight
            className="h-6 w-6 shrink-0 text-[var(--color-accent-foreground)] transition-transform duration-200 motion-safe:group-hover/cta:translate-x-0.5"
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      </span>
    </Link>
  );
}
