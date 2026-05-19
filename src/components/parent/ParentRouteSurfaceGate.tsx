"use client";

import type { ReactNode } from "react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";

export interface ParentRouteSurfaceGateProps {
  children: ReactNode;
  skeleton?: ReactNode;
}

function ParentRouteSkeleton() {
  return <div className="h-24 animate-pulse rounded bg-[var(--color-muted)]" aria-hidden />;
}

/**
 * Tier A surface gate for parent routes. The parent layout already mounts
 * {@link ParentPwaShell} on narrow viewports; page bodies can stay shared until
 * a route needs a dedicated mobile tree.
 */
export function ParentRouteSurfaceGate({ children, skeleton }: ParentRouteSurfaceGateProps) {
  const fallback = skeleton ?? <ParentRouteSkeleton />;
  return (
    <SurfaceMountGate skeleton={fallback} desktop={children} narrow={() => children} />
  );
}
