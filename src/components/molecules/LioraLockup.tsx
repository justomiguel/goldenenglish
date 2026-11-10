import { LioraDancerPose } from "@/components/atoms/LioraDancerPose";

export interface LioraLockupProps {
  /** Brand name from the brand layer. The last word gets the rose accent. */
  brandName: string;
  /** Short motto under the name. It leaves when the header is compact. */
  motto?: string;
  compact?: boolean;
}

export function LioraLockup({ brandName, motto = "", compact = false }: LioraLockupProps) {
  const words = brandName.trim().split(/\s+/).filter(Boolean);
  const accent = words.length > 1 ? words[words.length - 1] : "";
  const lead = accent ? words.slice(0, -1).join(" ") : words.join(" ");

  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <LioraDancerPose
        pose="arabesque"
        strokeWidth={compact ? 2.4 : 2}
        className={`shrink-0 text-[var(--liora-rose-deep)] transition-[width,height] duration-500 ease-[var(--liora-ease)] ${compact ? "h-8 w-7" : "h-12 w-10"}`}
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          data-lockup-part
          className={`whitespace-nowrap font-[family-name:var(--font-liora-display)] uppercase text-[var(--liora-ink)] transition-[font-size] duration-500 ease-[var(--liora-ease)] ${compact ? "text-base tracking-[0.18em]" : "text-lg tracking-[0.16em] md:text-xl"}`}
        >
          {lead}
          {accent ? (
            <span className="ms-2 text-[0.62em] tracking-[0.3em] text-[var(--liora-rose-text)]">{accent}</span>
          ) : null}
        </span>
        {motto ? (
          <span
            data-lockup-part
            data-lockup-motto
            aria-hidden={compact}
            className={`overflow-hidden whitespace-nowrap text-[0.6rem] max-md:hidden uppercase tracking-[0.3em] text-[var(--liora-ink-soft)] transition-[max-height,opacity,margin] duration-500 ease-[var(--liora-ease)] ${compact ? "mt-0 max-h-0 opacity-0" : "mt-1.5 max-h-4 opacity-100"}`}
          >
            {motto}
          </span>
        ) : null}
      </span>
    </span>
  );
}
