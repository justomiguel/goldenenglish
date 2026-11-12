import type { ReactNode } from "react";
import { espaciozenitSurfaces } from "@/variants/owned/espaciozenit/surfaces";
import { nagoSurfaces } from "@/variants/owned/nago/surfaces";
import { lioraSurfaces } from "@/variants/owned/liora/surfaces";
import { matissSurfaces } from "@/variants/owned/matiss/surfaces";
import { mimundoSurfaces } from "@/variants/owned/mimundo/surfaces";
import { mozarthitosSurfaces } from "@/variants/owned/mozarthitos/surfaces";

const catalogs = [
  matissSurfaces,
  lioraSurfaces,
  mozarthitosSurfaces,
  mimundoSurfaces,
  espaciozenitSurfaces,
  nagoSurfaces,
];

export function renderOwnedSurface(slot: string, kind: string, props: object): ReactNode | undefined {
  const catalog = catalogs.find((item) => item.owner === kind);
  const render = catalog?.slots[slot];
  if (!render) return undefined;
  return render(props);
}
