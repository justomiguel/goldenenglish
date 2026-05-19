"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";

export interface EspacioZenitGalleryModalControlsProps {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
}

export function EspacioZenitGalleryModalControls({
  index,
  total,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: EspacioZenitGalleryModalControlsProps) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-[44px] gap-2 border-[rgb(0_174_239_/35%)] bg-black/40 text-white hover:bg-[rgb(0_174_239_/12%)]"
        onClick={onPrev}
        aria-label={prevLabel}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{prevLabel}</span>
      </Button>
      <span
        className="min-w-[4.5rem] text-center text-sm font-medium text-white/75"
        aria-hidden
      >
        {index + 1} / {total}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-[44px] gap-2 border-[rgb(0_174_239_/35%)] bg-black/40 text-white hover:bg-[rgb(0_174_239_/12%)]"
        onClick={onNext}
        aria-label={nextLabel}
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </Button>
    </>
  );
}
