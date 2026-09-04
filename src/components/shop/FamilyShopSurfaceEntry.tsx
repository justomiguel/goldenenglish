"use client";

import type { ReactNode } from "react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";

export function FamilyShopSurfaceEntry({ children }: { children: ReactNode }) {
  return (
    <SurfaceMountGate
      skeleton={<div className="h-24 animate-pulse rounded bg-[var(--color-muted)]" aria-hidden />}
      desktop={children}
      narrow={() => children}
    />
  );
}
