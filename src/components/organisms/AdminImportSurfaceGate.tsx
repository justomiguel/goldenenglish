"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminImportScreenSkeleton } from "@/components/molecules/AdminImportScreenSkeleton";
import { AdminImportScreenNarrow } from "@/components/pwa/organisms/AdminImportScreenNarrow";

interface AdminImportSurfaceGateProps {
  desktop: ReactNode;
  dict: Dictionary;
}

export function AdminImportSurfaceGate({
  desktop,
  dict,
}: AdminImportSurfaceGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminImportScreenSkeleton />}
      desktop={desktop}
      narrow={(surface) => (
        <AdminImportScreenNarrow dict={dict} surface={surface} />
      )}
    />
  );
}
