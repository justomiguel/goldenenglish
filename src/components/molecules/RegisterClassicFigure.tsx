import { RegisterCollage } from "@/components/molecules/RegisterCollage";

interface RegisterClassicFigureProps {
  title: string;
  lead: string;
  collageAlts: readonly string[];
}

export function RegisterClassicFigure({
  title,
  lead,
  collageAlts,
}: RegisterClassicFigureProps) {
  return (
    <aside className="hidden lg:block">
      <RegisterCollage alts={collageAlts} />
      <h2 className="mt-8 font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
        {lead}
      </p>
    </aside>
  );
}
