import { getBrandForRequest } from "@/lib/brand/server";
import { readInstallIconSource } from "@/lib/brand/readInstallIconSource";
import {
  isInstallIconSize,
  renderInstallIconPng,
  rgbFromCssColor,
} from "@/lib/brand/renderInstallIconPng";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INK: [number, number, number] = [58, 42, 82];
const PAPER: [number, number, number] = [252, 244, 247];

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
): Promise<Response> {
  const { size } = await context.params;
  if (!isInstallIconSize(size)) {
    return new Response(null, { status: 404 });
  }
  const [brand, { properties }] = await Promise.all([
    getBrandForRequest(),
    loadEffectiveProperties(),
  ]);
  const sourcePng = await readInstallIconSource(brand);
  const png = renderInstallIconPng({
    size: Number(size),
    name: brand.name,
    sourcePng,
    ink: rgbFromCssColor(getProperty(properties, "color.foreground", ""), INK),
    paper: rgbFromCssColor(getProperty(properties, "color.background", ""), PAPER),
  });
  return new Response(Buffer.from(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
