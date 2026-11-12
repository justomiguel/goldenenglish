import type { ReactNode } from "react";
import { renderOwnedSurface } from "@/variants/ownedSurfaces";

interface PublicTenantChromeProps {
  templateKind: string;
  className?: string;
  children: ReactNode;
}

/** Puts login/register/contact inside the tenant landing root so shared forms inherit its tokens. */
export function PublicTenantChrome({
  templateKind,
  className = "min-h-screen",
  children,
}: PublicTenantChromeProps) {
  const owned = renderOwnedSurface("chrome", templateKind, { className, children });
  if (owned) return owned;
  return children;
}
