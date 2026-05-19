import type { ReactNode } from "react";
import { ParentRouteSurfaceGate } from "@/components/parent/ParentRouteSurfaceGate";

export interface ParentWardProfileSurfaceEntryProps {
  children: ReactNode;
}

export function ParentWardProfileSurfaceEntry({ children }: ParentWardProfileSurfaceEntryProps) {
  return <ParentRouteSurfaceGate>{children}</ParentRouteSurfaceGate>;
}
