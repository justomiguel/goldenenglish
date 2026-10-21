"use client";

import { createContext, use, type ReactNode } from "react";
import { useDashboardMobileDrawer } from "@/hooks/useDashboardMobileDrawer";

export interface AdminMobileShellState {
  open: boolean;
  openDrawer: () => void;
  close: () => void;
}

const AdminMobileShellContext = createContext<AdminMobileShellState | null>(null);

export function AdminMobileShellProvider({ children }: { children: ReactNode }) {
  const value = useDashboardMobileDrawer();
  return (
    <AdminMobileShellContext.Provider value={value}>{children}</AdminMobileShellContext.Provider>
  );
}

/** Null when the drawer is rendered outside the admin shell (unit tests). */
export function useAdminMobileShell(): AdminMobileShellState | null {
  return use(AdminMobileShellContext);
}
