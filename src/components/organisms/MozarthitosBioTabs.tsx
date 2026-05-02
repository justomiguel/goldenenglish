"use client";

import { useState } from "react";
import Image from "next/image";

export interface MozarthitosBioTabsProps {
  tabFelipe: string;
  tabJane: string;
  felipePortraitSrc: string;
  janePortraitSrc: string;
  felipeParagraphs: ReadonlyArray<string>;
  janeParagraphs: ReadonlyArray<string>;
  /** Paleta sobre fondo coral (#ff455d) como el sitio original */
  surface?: "default" | "onPink";
}

export function MozarthitosBioTabs({
  tabFelipe,
  tabJane,
  felipePortraitSrc,
  janePortraitSrc,
  felipeParagraphs,
  janeParagraphs,
  surface = "default",
}: MozarthitosBioTabsProps) {
  const [tab, setTab] = useState<"felipe" | "jane">("felipe");
  const paragraphs = tab === "felipe" ? felipeParagraphs : janeParagraphs;
  const pink = surface === "onPink";

  const tabIdle = pink
    ? "border-2 border-[var(--mz-pink)]/22 bg-white text-[var(--mz-ink-on-white)] shadow-sm"
    : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)]";

  const tabActive = pink
    ? "border-2 border-transparent bg-[var(--mz-pink)] text-white shadow-[0_12px_28px_rgb(255_69_93_/38%)]"
    : "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-foreground)]";

  const panelCls = pink
    ? "space-y-4 rounded-[22px] border border-[var(--mz-pink)]/12 bg-white px-5 py-6 text-sm leading-relaxed text-[var(--mz-ink-on-white)] shadow-[0_22px_48px_rgb(0_0_0_/12%)] md:px-7 md:text-base"
    : "space-y-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base";

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={`${tabFelipe} / ${tabJane}`}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "felipe"}
          className={[
            "inline-flex min-h-[48px] w-full flex-1 items-center justify-start gap-3 rounded-[20px] px-4 py-2.5 text-left text-sm font-semibold transition-colors sm:w-auto sm:min-w-0 sm:justify-center",
            tab === "felipe" ? tabActive : tabIdle,
          ].join(" ")}
          onClick={() => setTab("felipe")}
        >
          <Image
            src={felipePortraitSrc}
            alt=""
            width={40}
            height={40}
            className={[
              "h-11 w-11 shrink-0 rounded-full object-cover ring-2",
              pink ? "ring-[var(--mz-pink)]/35" : "ring-[var(--color-border)]",
            ].join(" ")}
          />
          {tabFelipe}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "jane"}
          className={[
            "inline-flex min-h-[48px] w-full flex-1 items-center justify-start gap-3 rounded-[20px] px-4 py-2.5 text-left text-sm font-semibold transition-colors sm:w-auto sm:min-w-0 sm:justify-center",
            tab === "jane" ? tabActive : tabIdle,
          ].join(" ")}
          onClick={() => setTab("jane")}
        >
          <Image
            src={janePortraitSrc}
            alt=""
            width={40}
            height={40}
            className={[
              "h-11 w-11 shrink-0 rounded-full object-cover ring-2",
              pink ? "ring-[var(--mz-pink)]/35" : "ring-[var(--color-border)]",
            ].join(" ")}
          />
          {tabJane}
        </button>
      </div>
      <div role="tabpanel" className={panelCls}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
