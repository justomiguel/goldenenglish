import { encodeRgbaPng } from "@/lib/brand/encodePng";

/** 5×7 glyphs. Each row is five bits, left to right. */
const GLYPH: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 18, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31],
  "3": [30, 1, 1, 14, 1, 1, 30],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 16, 30, 1, 1, 30],
  "6": [14, 16, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 1, 14],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8],
  "-": [0, 0, 0, 31, 0, 0, 0],
};

export function glyphRows(char: string): readonly number[] | null {
  const key = fold(char).trim()[0];
  if (!key) return null;
  return GLYPH[key] ?? null;
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ., -]/g, " ");
}

function wrap(text: string, maxChars: number): string[] {
  const words = fold(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word.slice(0, maxChars);
    } else {
      line = next.slice(0, maxChars);
    }
    if (lines.length === 3) break;
  }
  if (line && lines.length < 3) lines.push(line);
  return lines;
}

function paintGlyph(
  rgba: Uint8Array,
  width: number,
  glyph: number[] | undefined,
  x: number,
  y: number,
  scale: number,
  rgb: [number, number, number],
) {
  const rows = glyph ?? GLYPH[" "];
  if (!rows) return;
  for (let row = 0; row < 7; row += 1) {
    const bits = rows[row] ?? 0;
    for (let col = 0; col < 5; col += 1) {
      if (((bits >> (4 - col)) & 1) === 0) continue;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const px = x + col * scale + sx;
          const py = y + row * scale + sy;
          if (px < 0 || py < 0 || px >= width || py >= 630) continue;
          const i = (py * width + px) * 4;
          rgba[i] = rgb[0];
          rgba[i + 1] = rgb[1];
          rgba[i + 2] = rgb[2];
          rgba[i + 3] = 255;
        }
      }
    }
  }
}

function paintLine(
  rgba: Uint8Array,
  width: number,
  line: string,
  x: number,
  y: number,
  scale: number,
  rgb: [number, number, number],
) {
  const step = 5 * scale + scale;
  for (let i = 0; i < line.length; i += 1) {
    paintGlyph(rgba, width, GLYPH[line[i] ?? " "], x + i * step, y, scale, rgb);
  }
}

/** 1200×630 card. The name and tagline are the admin text. */
export function shareCardPng(input: {
  name: string;
  description: string;
  ink: [number, number, number];
  paper: [number, number, number];
}): Uint8Array {
  const width = 1200;
  const height = 630;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    rgba[i * 4] = input.paper[0];
    rgba[i * 4 + 1] = input.paper[1];
    rgba[i * 4 + 2] = input.paper[2];
    rgba[i * 4 + 3] = 255;
  }
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      rgba[i] = input.ink[0];
      rgba[i + 1] = input.ink[1];
      rgba[i + 2] = input.ink[2];
    }
  }
  const name = wrap(input.name, 22)[0] ?? "";
  paintLine(rgba, width, name, 64, 180, 8, input.ink);
  const lines = wrap(input.description, 42);
  lines.forEach((line, index) => {
    paintLine(rgba, width, line, 64, 320 + index * 36, 4, input.ink);
  });
  return encodeRgbaPng(width, height, rgba);
}
