"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { ProfileAvatarChangeFabMenu } from "@/components/molecules/ProfileAvatarChangeFabMenu";
import { ProfileAvatarWebcamDialog } from "@/components/molecules/ProfileAvatarWebcamDialog";
import type { ProfileAvatarChangeFabLabels } from "@/components/molecules/profileAvatarChangeFabLabels";
import { useAvatarUploadPreview } from "@/hooks/useAvatarUploadPreview";
import { useProfileAvatarWebcam } from "@/hooks/useProfileAvatarWebcam";
import { uploadProfileAvatar, type ProfileAvatarErrorKey } from "@/lib/profile/uploadProfileAvatar";
import {
  PROFILE_AVATAR_MAX_BYTES,
  fillProfileAvatarMaxMbTemplate,
} from "@/lib/profile/avatarUploadLimits";

export type { ProfileAvatarChangeFabLabels } from "@/components/molecules/profileAvatarChangeFabLabels";

function messageForError(key: ProfileAvatarErrorKey, labels: ProfileAvatarChangeFabLabels): string {
  switch (key) {
    case "avatarTooBig":
      return fillProfileAvatarMaxMbTemplate(labels.avatarTooBig);
    case "avatarInvalidType":
      return labels.avatarInvalidType;
    case "avatarSessionMissing":
      return labels.avatarSessionMissing;
    case "avatarProfileMissing":
      return labels.avatarProfileMissing;
    case "avatarNoFile":
      return labels.avatarNoFile;
    default:
      return labels.avatarError;
  }
}

export interface ProfileAvatarChangeFabProps {
  locale: string;
  displayName: string;
  avatarDisplayUrl: string | null;
  labels: ProfileAvatarChangeFabLabels;
}

export function ProfileAvatarChangeFab({
  locale,
  displayName,
  avatarDisplayUrl,
  labels,
}: ProfileAvatarChangeFabProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fabTipId = useId();
  const { resolvedAvatarUrl, setPreviewFromFile } = useAvatarUploadPreview(avatarDisplayUrl);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const onWebcamFailure = useCallback((msg: string) => {
    setBanner({ tone: "err", text: msg });
  }, []);

  const openNativeCameraFallback = useCallback(() => {
    requestAnimationFrame(() => {
      cameraInputRef.current?.click();
    });
  }, []);

  const { webcamOpen, webcamStream, handleWebcamOpenChange, requestWebcam } = useProfileAvatarWebcam(
    labels.avatarWebcamPermissionDenied,
    labels.avatarWebcamOpenFailed,
    onWebcamFailure,
    openNativeCameraFallback,
  );

  useEffect(() => {
    if (!menuOpen) return;
    function onDocDown(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (menuPortalRef.current?.contains(t)) return;
      closeMenu();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const runUpload = useCallback(
    (file: File | null | undefined) => {
      if (!file || file.size === 0) return;
      if (file.size > PROFILE_AVATAR_MAX_BYTES) {
        setBanner({ tone: "err", text: fillProfileAvatarMaxMbTemplate(labels.avatarTooBig) });
        return;
      }
      setBanner(null);
      const fd = new FormData();
      fd.set("locale", locale);
      fd.set("avatar", file);
      startTransition(async () => {
        const res = await uploadProfileAvatar(fd);
        if (res.ok) {
          setPreviewFromFile(file);
          setBanner({ tone: "ok", text: labels.avatarSuccess });
          closeMenu();
          router.refresh();
          return;
        }
        setBanner({ tone: "err", text: messageForError(res.errorKey, labels) });
      });
    },
    [closeMenu, labels, locale, router, setPreviewFromFile],
  );

  const fabTooltip = fillProfileAvatarMaxMbTemplate(labels.avatarFabTooltip);
  const hintResolved = fillProfileAvatarMaxMbTemplate(labels.avatarHint);

  function onPickFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    runUpload(file);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <div className="relative z-0 rounded-full bg-[var(--color-surface)] p-1 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_42%,transparent),0_6px_20px_-6px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] ring-4 ring-[var(--color-surface)]">
        <ProfileAvatar
          key={resolvedAvatarUrl ?? "none"}
          url={resolvedAvatarUrl}
          displayName={displayName}
          size="xl"
        />
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={onPickFromInput}
        aria-hidden
        tabIndex={-1}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onPickFromInput}
        aria-hidden
        tabIndex={-1}
      />

      <span className="group/fab absolute bottom-0 right-0 z-20 inline-flex">
        <span id={fabTipId} className="sr-only">
          {fabTooltip}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => setMenuOpen((o) => !o)}
          className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md ring-2 ring-[var(--color-surface)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[var(--color-primary-dark)] hover:shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--color-foreground)_24%,transparent),inset_0_1px_0_0_color-mix(in_srgb,var(--color-primary-foreground)_32%,transparent)] active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label={labels.avatarFabAria}
          aria-describedby={fabTipId}
        >
          <Camera className="h-5 w-5" aria-hidden strokeWidth={2} />
        </button>
        <span
          role="tooltip"
          aria-hidden
          className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[var(--layout-border-radius)] border border-[color-mix(in_srgb,var(--color-accent)_26%,var(--color-border))] bg-[var(--color-surface)] px-2.5 py-1.5 text-center text-xs leading-snug text-[var(--color-foreground)] opacity-0 shadow-md ring-1 ring-[color-mix(in_srgb,var(--color-accent)_32%,transparent)] transition-opacity duration-150 group-hover/fab:opacity-100 group-focus-within/fab:opacity-100"
        >
          {fabTooltip}
        </span>
      </span>

      {menuOpen ? (
        <ProfileAvatarChangeFabMenu
          ref={menuPortalRef}
          anchorRef={wrapRef}
          labels={labels}
          hintResolved={hintResolved}
          onTakePhoto={() => {
            closeMenu();
            requestWebcam();
          }}
          onUploadFromGallery={() => {
            closeMenu();
            galleryInputRef.current?.click();
          }}
        />
      ) : null}

      <ProfileAvatarWebcamDialog
        open={webcamOpen}
        mediaStream={webcamStream}
        onOpenChange={handleWebcamOpenChange}
        labels={{
          avatarWebcamTitle: labels.avatarWebcamTitle,
          avatarWebcamLead: labels.avatarWebcamLead,
          avatarWebcamCapture: labels.avatarWebcamCapture,
          avatarWebcamCancel: labels.avatarWebcamCancel,
          avatarWebcamPermissionDenied: labels.avatarWebcamPermissionDenied,
          avatarWebcamOpenFailed: labels.avatarWebcamOpenFailed,
        }}
        onPhotoFile={(file) => runUpload(file)}
        onFailureMessage={onWebcamFailure}
      />

      {banner ? (
        <p
          role="status"
          className={`mt-2 max-w-[12.5rem] text-center text-xs sm:max-w-none ${
            banner.tone === "ok" ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"
          }`}
        >
          {banner.text}
        </p>
      ) : null}
    </div>
  );
}
