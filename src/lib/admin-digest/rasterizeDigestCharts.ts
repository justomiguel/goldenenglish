import "server-only";

export async function rasterizeDigestSvg(svg: string): Promise<string | null> {
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 640 } }).render().asPng();
    return Buffer.from(png).toString("base64");
  } catch {
    return null;
  }
}
