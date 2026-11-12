import { ArrowRight } from "lucide-react";
import styles from "@/components/organisms/generic-landing/genericLanding.module.css";

export interface NavVariantProps {
  kind: string;
  siteName: string;
  logoSrc?: string | null;
  logoAlt: string;
  cta: string;
  items: readonly { id: string; label: string }[];
}

export default function NavGeneric({ kind, siteName, logoSrc, logoAlt, cta, items }: NavVariantProps) {
  return (
    <header className={styles.bar} data-kind={kind}>
      <div
        className={`${styles.scroller} mx-auto flex max-w-6xl flex-nowrap items-center gap-x-4 px-[max(1rem,env(safe-area-inset-left,0px))] pe-[max(1rem,env(safe-area-inset-right,0px))] py-2`}
      >
        <a href="#inicio" className="inline-flex min-h-11 shrink-0 items-center gap-2">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- institute logo from the brand layer
            <img src={logoSrc} alt="" className="h-9 w-9 object-contain" />
          ) : null}
          <span className="max-w-[10rem] truncate text-base font-semibold">{logoAlt || siteName}</span>
        </a>
        <nav aria-label={siteName} className="flex shrink-0 items-center gap-x-3">
          {items.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="inline-flex min-h-11 items-center whitespace-nowrap text-sm">
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#contacto" className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold">
          <ArrowRight className="h-4 w-4" aria-hidden />
          {cta}
        </a>
      </div>
    </header>
  );
}
