const HTTPS = "https:";

export function emailImageHtml(input: { src: string; alt: string }): string | null {
  const src = httpsUrl(input.src);
  if (!src) return null;
  return `<img src="${src}" alt="${escapeHtml(input.alt)}" />`;
}

export function emailVideoLinkHtml(raw: string, input: { label: string }): string | null {
  const youtube = youtubeId(raw);
  if (youtube) {
    const watch = `https://www.youtube.com/watch?v=${youtube}`;
    const thumb = `https://img.youtube.com/vi/${youtube}/hqdefault.jpg`;
    return `<p><a href="${watch}"><img src="${thumb}" alt="${escapeHtml(input.label)}" /></a></p>`;
  }
  const vimeo = vimeoId(raw);
  if (!vimeo) return null;
  const href = `https://vimeo.com/${vimeo}`;
  return `<p><a href="${href}">${escapeHtml(input.label)}</a></p>`;
}

function httpsUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== HTTPS) return null;
  return url.href;
}

function youtubeId(raw: string): string | null {
  const url = parseHttps(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return mediaId(url.pathname.split("/").filter(Boolean)[0]);
  if (host !== "youtube.com" && host !== "m.youtube.com") return null;
  if (url.pathname === "/watch") return mediaId(url.searchParams.get("v"));
  const [kind, id] = url.pathname.split("/").filter(Boolean);
  if (kind === "embed" || kind === "shorts" || kind === "live") return mediaId(id);
  return null;
}

function vimeoId(raw: string): string | null {
  const url = parseHttps(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "vimeo.com") return numericId(url.pathname.split("/").filter(Boolean)[0]);
  if (host !== "player.vimeo.com") return null;
  const [kind, id] = url.pathname.split("/").filter(Boolean);
  return kind === "video" ? numericId(id) : null;
}

function parseHttps(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  return url.protocol === HTTPS ? url : null;
}

function mediaId(value: string | null | undefined): string | null {
  if (!value || !/^[A-Za-z0-9_-]{6,20}$/.test(value)) return null;
  return value;
}

function numericId(value: string | undefined): string | null {
  if (!value || !/^\d{6,12}$/.test(value)) return null;
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
