import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";
import { PUBLIC_MARKETING_CHROME_CLASS } from "@/lib/theme/publicExperienceNav";

interface PublicContentLanguageFooterProps {
  locale: string;
  labels: LanguageSwitcherLabels;
  variant?: "default" | "compact" | "compactDark";
  /** Border + spacing tuned for light marketing shells (blog/events classic, Nago). */
  tone?: "light" | "dark";
  extra?: ReactNode;
}

export function PublicContentLanguageFooter({
  locale,
  labels,
  variant = "default",
  tone = "light",
  extra,
}: PublicContentLanguageFooterProps) {
  const borderClass =
    tone === "dark" ? "border-white/10" : "border-[var(--color-border)]";

  return (
    <footer
      className={`${PUBLIC_MARKETING_CHROME_CLASS} mx-auto mt-12 w-full max-w-6xl border-t ${borderClass} px-4 pb-8 pt-8`}
    >
      <div className="flex flex-col items-center gap-3">
        <LanguageSwitcher locale={locale} labels={labels} variant={variant} />
        {extra}
      </div>
    </footer>
  );
}
