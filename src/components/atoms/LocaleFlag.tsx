import { useId } from "react";
import type { AppLocale } from "@/lib/i18n/dictionaries";

interface LocaleFlagProps {
  locale: AppLocale;
  className?: string;
}

/** Small inline SVG flags for locale switchers (standard national colors). */
export function LocaleFlag({ locale, className = "" }: LocaleFlagProps) {
  const clipId = useId().replace(/:/g, "");
  const box = `inline-flex shrink-0 overflow-hidden rounded-[2px] ${className}`;

  if (locale === "es") {
    return (
      <span className={`${box} h-2.5 w-[0.94rem]`} aria-hidden>
        <svg
          viewBox="0 0 3 2"
          className="size-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="3" height="2" fill="#AA151B" />
          <rect y="0.5" width="3" height="1" fill="#F1BF00" />
        </svg>
      </span>
    );
  }

  return (
    <span className={`${box} h-2.5 w-[1.125rem]`} aria-hidden>
      <svg
        viewBox="0 0 60 30"
        className="size-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <clipPath id={clipId}>
          <path d="M30 15h30v15zv-30h-30zH0v15zV0h30z" />
        </clipPath>
        <path fill="#012169" d="M0 0h60v30H0z" />
        <path stroke="#FFF" strokeWidth="6" d="M0 0l60 30M60 0L0 30" />
        <path
          stroke="#C8102E"
          strokeWidth="4"
          d="M0 0l60 30M60 0L0 30"
          clipPath={`url(#${clipId})`}
        />
        <path stroke="#FFF" strokeWidth="10" d="M30 0v30M0 15h60" />
        <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60" />
      </svg>
    </span>
  );
}
