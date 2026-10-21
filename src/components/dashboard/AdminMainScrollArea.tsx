"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { PwaPullToRefresh } from "@/components/pwa/molecules/PwaPullToRefresh";
import { useAppSurface } from "@/hooks/useAppSurface";
import {
  getAdminHomeEditMode,
  subscribeAdminHomeEditMode,
} from "@/lib/client/adminHomeEditMode";

export interface AdminMainScrollAreaProps {
  children: ReactNode;
  copy: Dictionary["pwa"]["pullToRefresh"];
}

/** Pull-to-refresh on phone and installed admin. Desktop scroll stays plain. */
export function AdminMainScrollArea({ children, copy }: AdminMainScrollAreaProps) {
  const surface = useAppSurface();
  const router = useRouter();
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const editingHome = useSyncExternalStore(subscribeAdminHomeEditMode, getAdminHomeEditMode, () => false);

  if (surface === "web-desktop") return <>{children}</>;

  return (
    <PwaPullToRefresh onRefresh={refresh} copy={copy} enabled={!editingHome}>
      {children}
    </PwaPullToRefresh>
  );
}
