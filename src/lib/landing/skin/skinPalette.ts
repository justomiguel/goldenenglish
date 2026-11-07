import { genericKindColorOverrides, type GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

/**
 * Moves the palette of a skin to another skin when the owner never changed it.
 * Compares and writes only the keys that `genericKindColorOverrides` returns.
 */
export function swapSkinPalette(args: {
  from: GenericInstituteKind;
  to: GenericInstituteKind;
  properties: Record<string, string>;
}): Record<string, string> {
  const before = genericKindColorOverrides(args.from);
  const untouched = Object.entries(before).every(([key, value]) => {
    const current = args.properties[key];
    return current === undefined || current.toLowerCase() === value.toLowerCase();
  });
  if (!untouched) return args.properties;
  return { ...args.properties, ...genericKindColorOverrides(args.to) };
}
