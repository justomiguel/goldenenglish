"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminImportScreenSkeleton } from "@/components/molecules/AdminImportScreenSkeleton";
import { AdminImportScreenNarrow } from "@/components/pwa/organisms/AdminImportScreenNarrow";

interface AdminImportSurfaceGateProps {
  desktop: ReactNode;
  dict: Dictionary;
  /** Nested under Usuarios layout (skip duplicate title / full-page chrome on mobile). */
  embedded?: boolean;
}

export function AdminImportSurfaceGate({
  desktop,
  dict,
  embedded = false,
}: AdminImportSurfaceGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminImportScreenSkeleton />}
      desktop={desktop}
      narrow={(surface) => (
        <AdminImportScreenNarrow dict={dict} surface={surface} embedded={embedded} />
      )}
    />
  );
}
