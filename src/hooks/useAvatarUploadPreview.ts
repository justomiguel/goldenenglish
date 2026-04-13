import { useCallback, useEffect, useRef, useState } from "react";

/**
 * After a successful avatar upload, shows a local `blob:` immediately while
 * `router.refresh()` loads the new signed URL from the server.
 */
export function useAvatarUploadPreview(avatarDisplayUrl: string | null) {
  const [override, setOverride] = useState<string | null>(null);
  const overrideRef = useRef<string | null>(null);
  const lastServerAvatarUrlRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    overrideRef.current = override;
  }, [override]);

  useEffect(
    () => () => {
      const u = overrideRef.current;
      if (u) URL.revokeObjectURL(u);
    },
    [],
  );

  useEffect(() => {
    if (lastServerAvatarUrlRef.current === undefined) {
      lastServerAvatarUrlRef.current = avatarDisplayUrl;
      return;
    }
    if (lastServerAvatarUrlRef.current === avatarDisplayUrl) return;
    lastServerAvatarUrlRef.current = avatarDisplayUrl;
    queueMicrotask(() => {
      setOverride((prev) => {
        if (!prev) return null;
        URL.revokeObjectURL(prev);
        return null;
      });
    });
  }, [avatarDisplayUrl]);

  const setPreviewFromFile = useCallback((file: File) => {
    const blobUrl = URL.createObjectURL(file);
    overrideRef.current = blobUrl;
    setOverride(blobUrl);
  }, []);

  const resolvedUrl = override ?? avatarDisplayUrl;

  return { resolvedAvatarUrl: resolvedUrl, setPreviewFromFile };
}
