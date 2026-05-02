"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import {
  uploadSiteThemeFaviconFromEditorAction,
  uploadSiteThemeLogoFromEditorAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeBrandAssetActions";
import {
  LANDING_MEDIA_MAX_BYTES,
  isAcceptedLandingMediaMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import { faviconFileIsZip } from "@/lib/site/faviconUploadFileKind";
import type { SiteThemeActionErrorCode } from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";

export type BrandAssetUploadUi =
  | { kind: "idle" }
  | { kind: "busy"; stage: "reading"; readPercent: number }
  | { kind: "busy"; stage: "sending" };

export function useSiteThemeBrandAssetUploads(props: {
  locale: string;
  themeId: string;
  logoAltDraft: string;
  onAssetsUpdated: (
    applied: Record<string, string>,
    cleared: string[],
  ) => void;
}) {
  const { locale, themeId, logoAltDraft, onAssetsUpdated } = props;
  const logoInputId = useId();
  const favInputId = useId();
  const logoFileRef = useRef<HTMLInputElement | null>(null);
  const favFileRef = useRef<HTMLInputElement | null>(null);
  const [altInput, setAltInput] = useState(logoAltDraft);
  const [errorCode, setErrorCode] = useState<SiteThemeActionErrorCode | null>(
    null,
  );
  const [logoOk, setLogoOk] = useState(false);
  const [favOk, setFavOk] = useState(false);
  const [uploadUi, setUploadUi] = useState<BrandAssetUploadUi>({
    kind: "idle",
  });

  useEffect(() => {
    setAltInput(logoAltDraft);
  }, [logoAltDraft]);

  const pending = uploadUi.kind !== "idle";

  const handleLogoPickClick = useCallback(() => {
    setErrorCode(null);
    setLogoOk(false);
    logoFileRef.current?.click();
  }, []);

  const handleFaviconPickClick = useCallback(() => {
    setErrorCode(null);
    setFavOk(false);
    favFileRef.current?.click();
  }, []);

  const handleLogoFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setErrorCode(null);
      setLogoOk(false);
      if (!isAcceptedLandingMediaMime(file.type)) {
        setErrorCode("mime_invalid");
        return;
      }
      if (file.size > LANDING_MEDIA_MAX_BYTES) {
        setErrorCode("media_too_large");
        return;
      }

      setUploadUi({ kind: "busy", stage: "reading", readPercent: 0 });
      try {
        const data = await readImageFileAsBase64(file, {
          onProgress: (r) =>
            setUploadUi({
              kind: "busy",
              stage: "reading",
              readPercent: Math.round(r * 100),
            }),
        });
        setUploadUi({ kind: "busy", stage: "sending" });
        const altTrim = altInput.trim();
        const res = await uploadSiteThemeLogoFromEditorAction({
          locale,
          id: themeId,
          contentType: data.mime || "image/png",
          fileBase64: data.base64,
          ...(altTrim ? { logoAlt: altTrim } : {}),
        });
        if (!res.ok) {
          setErrorCode(res.code);
          return;
        }
        onAssetsUpdated(res.applied ?? {}, res.cleared ?? []);
        setLogoOk(true);
      } catch {
        setErrorCode("persist_failed");
      } finally {
        setUploadUi({ kind: "idle" });
      }
    },
    [altInput, locale, onAssetsUpdated, themeId],
  );

  const handleFaviconFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setErrorCode(null);
      setFavOk(false);

      const isZip = faviconFileIsZip(file);
      if (!isZip) {
        if (!isAcceptedLandingMediaMime(file.type)) {
          setErrorCode("mime_invalid");
          return;
        }
      }
      if (file.size > LANDING_MEDIA_MAX_BYTES) {
        setErrorCode("media_too_large");
        return;
      }

      setUploadUi({ kind: "busy", stage: "reading", readPercent: 0 });
      try {
        const data = await readImageFileAsBase64(file, {
          onProgress: (r) =>
            setUploadUi({
              kind: "busy",
              stage: "reading",
              readPercent: Math.round(r * 100),
            }),
        });
        setUploadUi({ kind: "busy", stage: "sending" });
        const isZ = faviconFileIsZip(file);
        const res = isZ
          ? await uploadSiteThemeFaviconFromEditorAction({
              locale,
              id: themeId,
              faviconKind: "zip",
              faviconZipBase64: data.base64,
            })
          : await uploadSiteThemeFaviconFromEditorAction({
              locale,
              id: themeId,
              faviconKind: "single",
              faviconContentType: data.mime || "image/png",
              faviconBase64: data.base64,
            });
        if (!res.ok) {
          setErrorCode(res.code);
          return;
        }
        onAssetsUpdated(res.applied ?? {}, res.cleared ?? []);
        setFavOk(true);
      } catch {
        setErrorCode("persist_failed");
      } finally {
        setUploadUi({ kind: "idle" });
      }
    },
    [locale, onAssetsUpdated, themeId],
  );

  return {
    logoInputId,
    favInputId,
    logoFileRef,
    favFileRef,
    altInput,
    setAltInput,
    errorCode,
    logoOk,
    favOk,
    pending,
    uploadUi,
    handleLogoPickClick,
    handleFaviconPickClick,
    handleLogoFile,
    handleFaviconFile,
  };
}
