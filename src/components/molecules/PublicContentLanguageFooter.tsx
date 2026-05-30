import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";

interface PublicContentLanguageFooterProps {
  locale: string;
  labels: LanguageSwitcherLabels;
  variant?: "default" | "compact" | "compactDark";
  /** Border + spacing tuned for light marketing shells (blog/events classic, Nago). */
  tone?: "light" | "dark";
}

export function PublicContentLanguageFooter({
  locale,
  labels,
  variant = "default",
  tone = "light",
}: PublicContentLanguageFooterProps) {
  const borderClass =
    tone === "dark" ? "border-white/10" : "border-[var(--color-border)]";

  return (
    <footer
      className={`mx-auto mt-12 w-full max-w-6xl border-t ${borderClass} px-4 pb-8 pt-8`}
    >
      <div className="flex justify-center">
        <LanguageSwitcher locale={locale} labels={labels} variant={variant} />
      </div>
    </footer>
  );
}
