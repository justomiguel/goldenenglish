import type { ReactNode } from "react";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";

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
  if (templateKind === "nago") {
    return (
      <NagoFontRoot className={className} sound={false}>
        {children}
      </NagoFontRoot>
    );
  }
  if (templateKind === "liora") {
    return <LioraFontRoot className={className}>{children}</LioraFontRoot>;
  }
  if (templateKind === "mimundo") {
    return <MiMundoFontRoot className={className}>{children}</MiMundoFontRoot>;
  }
  if (templateKind === "mozarthitos") {
    return <MozarthitosFontRoot className={className}>{children}</MozarthitosFontRoot>;
  }
  if (templateKind === "espaciozenit") {
    return (
      <EspacioZenitFontRoot className={`${className} bg-black text-white`.trim()}>
        {children}
      </EspacioZenitFontRoot>
    );
  }
  return children;
}
