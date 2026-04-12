"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminImportScreenSkeleton } from "@/components/molecules/AdminImportScreenSkeleton";
import { AdminImportScreenNarrow } from "@/components/pwa/organisms/AdminImportScreenNarrow";

interface AdminImportSurfaceGateProps {
  locale: string;
  desktop: ReactNode;
  dict: Dictionary;
  /** Nested under Usuarios layout (skip duplicate title / full-page chrome on mobile). */
  embedded?: boolean;
}

export function AdminImportSurfaceGate({
  locale,
  desktop,
  dict,
  embedded = false,
}: AdminImportSurfaceGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminImportScreenSkeleton ariaLabel={dict.common.loadingAria} />}
      desktop={desktop}
      narrow={(surface) => (
        <AdminImportScreenNarrow
          locale={locale}
          dict={dict}
          surface={surface}
          embedded={embedded}
        />
      )}
    />
  );
}
