"use client";

import { PwaInstallPrompt } from "@/components/molecules/PwaInstallPrompt";
import type { Dictionary } from "@/types/i18n";

export interface PwaInstallPromptHostProps {
  copy: Dictionary["pwa"]["install"];
}

/**
 * Single floating mount for install CTA (locale layout). Clears parent PWA
 * tab-bar space on narrow viewports; desktop uses a simple bottom inset.
 */
export function PwaInstallPromptHost({ copy }: PwaInstallPromptHostProps) {
  return (
    <div
      data-testid="pwa-install-prompt-host"
      className="pointer-events-none fixed inset-x-0 z-[200] flex justify-center px-4 bottom-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))] md:bottom-[max(1rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="pointer-events-auto w-full max-w-sm">
        <PwaInstallPrompt copy={copy} />
      </div>
    </div>
  );
}
