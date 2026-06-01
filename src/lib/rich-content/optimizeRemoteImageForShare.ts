import sharp from "sharp";

export const SHARE_OG_WIDTH = 1200;
export const SHARE_OG_HEIGHT = 630;
const DEFAULT_MAX_BYTES = 280_000;

export type OptimizeRemoteImageForShareOptions = {
  width?: number;
  height?: number;
  maxBytes?: number;
  fetchTimeoutMs?: number;
};

export type OptimizedShareImage = {
  buffer: Buffer;
  contentType: "image/jpeg";
  width: number;
  height: number;
};

export async function fetchRemoteImageBuffer(
  url: string,
  timeoutMs = 8_000,
): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "force-cache",
      headers: { Accept: "image/*" },
    });
    if (!response.ok) {
      throw new Error(`fetch_failed_${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

export async function optimizeImageBufferForShare(
  input: Buffer,
  options?: OptimizeRemoteImageForShareOptions,
): Promise<OptimizedShareImage> {
  const width = options?.width ?? SHARE_OG_WIDTH;
  const height = options?.height ?? SHARE_OG_HEIGHT;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  let quality = 82;
  let buffer = await encodeShareJpeg(input, width, height, quality);

  while (buffer.byteLength > maxBytes && quality > 35) {
    quality -= 7;
    buffer = await encodeShareJpeg(input, width, height, quality);
  }

  return {
    buffer,
    contentType: "image/jpeg",
    width,
    height,
  };
}

export async function optimizeRemoteImageForShare(
  url: string,
  options?: OptimizeRemoteImageForShareOptions,
): Promise<OptimizedShareImage> {
  const raw = await fetchRemoteImageBuffer(url, options?.fetchTimeoutMs);
  return optimizeImageBufferForShare(raw, options);
}

async function encodeShareJpeg(
  input: Buffer,
  width: number,
  height: number,
  quality: number,
): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer();
}
