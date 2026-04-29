"use client";

import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

type IntroL = Dictionary["dashboard"]["siteSetup"]["intro"];

interface SiteSetupIntroStepProps {
  labels: IntroL;
}

export function SiteSetupIntroStep({ labels }: SiteSetupIntroStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Sparkles
          className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-accent)]"
          aria-hidden
        />
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {labels.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {labels.body}
          </p>
        </div>
      </div>
    </div>
  );
}
