import { inflateSync } from "node:zlib";
import { encodeRgbaPng } from "@/lib/brand/encodePng";

export interface DecodedPng {
  width: number;
  height: number;
  rgba: Uint8Array;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw: Buffer, width: number, height: number, bpp: number): Uint8Array | null {
  const stride = width * bpp;
  const out = new Uint8Array(height * stride);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[offset];
    offset += 1;
    if (filter == null || offset + stride > raw.length) return null;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[offset + x] ?? 0;
      const left = x >= bpp ? out[y * stride + x - bpp]! : 0;
      const up = y > 0 ? out[(y - 1) * stride + x]! : 0;
      const upLeft = y > 0 && x >= bpp ? out[(y - 1) * stride + x - bpp]! : 0;
      let next = value;
      if (filter === 1) next = (value + left) & 255;
      else if (filter === 2) next = (value + up) & 255;
      else if (filter === 3) next = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) next = (value + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) return null;
      out[y * stride + x] = next;
    }
    offset += stride;
  }
  return out;
}

function toRgba(pixels: Uint8Array, width: number, height: number, channels: number): Uint8Array {
  if (channels === 4) return pixels;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    rgba[i * 4] = pixels[i * channels] ?? 0;
    rgba[i * 4 + 1] = pixels[i * channels + 1] ?? 0;
    rgba[i * 4 + 2] = pixels[i * channels + 2] ?? 0;
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

/** 8-bit non-interlaced RGB or RGBA PNG. Other files return null. */
export function decodePngRgba(png: Uint8Array): DecodedPng | null {
  const buf = Buffer.from(png);
  if (buf.length < 8 || buf[0] !== 137) return null;
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idat: Buffer[] = [];
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) return null;
      colorType = data[9] ?? -1;
      if (colorType !== 2 && colorType !== 6) return null;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  if (!width || !height || idat.length === 0) return null;
  const channels = colorType === 6 ? 4 : 3;
  let inflated: Buffer;
  try {
    inflated = inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }
  const pixels = unfilter(inflated, width, height, channels);
  if (!pixels) return null;
  return { width, height, rgba: toRgba(pixels, width, height, channels) };
}

export function scaleRgbaNearest(
  src: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
): Uint8Array {
  const dst = new Uint8Array(dstWidth * dstHeight * 4);
  for (let y = 0; y < dstHeight; y += 1) {
    const sy = Math.min(srcHeight - 1, Math.floor((y * srcHeight) / dstHeight));
    for (let x = 0; x < dstWidth; x += 1) {
      const sx = Math.min(srcWidth - 1, Math.floor((x * srcWidth) / dstWidth));
      const from = (sy * srcWidth + sx) * 4;
      const to = (y * dstWidth + x) * 4;
      dst[to] = src[from] ?? 0;
      dst[to + 1] = src[from + 1] ?? 0;
      dst[to + 2] = src[from + 2] ?? 0;
      dst[to + 3] = src[from + 3] ?? 255;
    }
  }
  return dst;
}

/** Returns a PNG of the requested size, or null when the bytes are not a plain PNG. */
export function scalePngNearest(png: Uint8Array, width: number, height: number): Uint8Array | null {
  const decoded = decodePngRgba(png);
  if (!decoded) return null;
  if (decoded.width === width && decoded.height === height) return png;
  return encodeRgbaPng(
    width,
    height,
    scaleRgbaNearest(decoded.rgba, decoded.width, decoded.height, width, height),
  );
}
