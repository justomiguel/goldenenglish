import { encodeRgbaPng } from "@/lib/brand/encodePng";
import { glyphRows } from "@/lib/brand/shareCardPng";

/** Square mark. The first letter of the name sits on the paper color. */
export function letterMarkPng(input: {
  name: string;
  size: number;
  ink: [number, number, number];
  paper: [number, number, number];
}): Uint8Array {
  const size = Math.max(16, Math.floor(input.size));
  const rgba = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    rgba[i * 4] = input.paper[0];
    rgba[i * 4 + 1] = input.paper[1];
    rgba[i * 4 + 2] = input.paper[2];
    rgba[i * 4 + 3] = 255;
  }
  const rows = glyphRows(input.name) ?? glyphRows("A");
  if (!rows) return encodeRgbaPng(size, size, rgba);
  const scale = Math.max(1, Math.floor(size / 12));
  const glyphWidth = 5 * scale;
  const glyphHeight = 7 * scale;
  const originX = Math.floor((size - glyphWidth) / 2);
  const originY = Math.floor((size - glyphHeight) / 2);
  for (let row = 0; row < 7; row += 1) {
    const bits = rows[row] ?? 0;
    for (let col = 0; col < 5; col += 1) {
      if (((bits >> (4 - col)) & 1) === 0) continue;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const px = originX + col * scale + sx;
          const py = originY + row * scale + sy;
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          const i = (py * size + px) * 4;
          rgba[i] = input.ink[0];
          rgba[i + 1] = input.ink[1];
          rgba[i + 2] = input.ink[2];
          rgba[i + 3] = 255;
        }
      }
    }
  }
  return encodeRgbaPng(size, size, rgba);
}
