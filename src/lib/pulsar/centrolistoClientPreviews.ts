export const CENTROLISTO_CLIENT_PREVIEW_DIR = "/centrolisto/clients";

const KNOWN_CLIENT_LOGO_PATHS: Record<string, readonly string[]> = {
  golden: ["/images/golden/logo/1.png"],
  mozarthitos: ["/images/mozarthitos/logo/1.png"],
  espaciozenit: ["/images/espaciozenit/logo/1.png"],
  nago: ["/images/nago/logo/logo.png"],
  mimundo: ["/images/mimundo/logo/logo.png"],
  liora: ["/images/liora/logo/logo.png"],
};

export function centrolistoClientPreviewPaths(slug: string): {
  videoSrc: string;
  posterSrc: string;
} {
  return {
    videoSrc: `${CENTROLISTO_CLIENT_PREVIEW_DIR}/${slug}.webm`,
    posterSrc: `${CENTROLISTO_CLIENT_PREVIEW_DIR}/${slug}.jpg`,
  };
}

export function centrolistoClientLogoCandidates(slug: string): readonly string[] {
  return (
    KNOWN_CLIENT_LOGO_PATHS[slug] ?? [
      `/images/${slug}/logo/logo.png`,
      `/images/${slug}/logo/1.png`,
    ]
  );
}

export function pickHomeClientPreviews<
  T extends {
    previewVideoSrc?: string;
    previewPosterSrc?: string;
    publicUrl?: string | null;
    hosts?: readonly string[];
  },
>(clients: readonly T[], limit = 2): T[] {
  const linked = clients.filter((client) => client.publicUrl || client.hosts?.[0]);
  const withMedia = linked.filter(
    (client) => client.previewVideoSrc || client.previewPosterSrc,
  );
  const rest = linked.filter((client) => !withMedia.includes(client));
  return [...withMedia, ...rest].slice(0, limit);
}

export function attachClientPreviewMedia<T extends { slug: string }>(
  clients: readonly T[],
  fileExists: (publicPath: string) => boolean,
): Array<
  T & {
    previewVideoSrc?: string;
    previewPosterSrc?: string;
    logoSrc?: string;
  }
> {
  return clients.map((client) => {
    const paths = centrolistoClientPreviewPaths(client.slug);
    return {
      ...client,
      previewVideoSrc: fileExists(paths.videoSrc) ? paths.videoSrc : undefined,
      previewPosterSrc: fileExists(paths.posterSrc) ? paths.posterSrc : undefined,
      logoSrc: centrolistoClientLogoCandidates(client.slug).find(fileExists),
    };
  });
}
