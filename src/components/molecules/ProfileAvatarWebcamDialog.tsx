"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { logClientException } from "@/lib/logging/clientLog";

const MAX_FRAME_PX = 1600;

export interface ProfileAvatarWebcamDialogLabels {
  avatarWebcamTitle: string;
  avatarWebcamLead: string;
  avatarWebcamCapture: string;
  avatarWebcamCancel: string;
  avatarWebcamPermissionDenied: string;
  avatarWebcamOpenFailed: string;
}

export interface ProfileAvatarWebcamDialogProps {
  open: boolean;
  mediaStream: MediaStream | null;
  onOpenChange: (open: boolean) => void;
  labels: ProfileAvatarWebcamDialogLabels;
  onPhotoFile: (file: File) => void;
  onFailureMessage: (message: string) => void;
}

function detachVideo(v: HTMLVideoElement | null) {
  if (v) v.srcObject = null;
}

function stopVideoAndTracks(v: HTMLVideoElement | null) {
  const s = v?.srcObject;
  if (s && typeof (s as MediaStream).getTracks === "function") {
    (s as MediaStream).getTracks().forEach((t) => t.stop());
  }
  if (v) v.srcObject = null;
}

export function ProfileAvatarWebcamDialog({
  open,
  mediaStream,
  onOpenChange,
  labels,
  onPhotoFile,
  onFailureMessage,
}: ProfileAvatarWebcamDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const descId = useId();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) {
      detachVideo(videoRef.current);
      queueMicrotask(() => setReady(false));
      return;
    }
    const v = videoRef.current;
    if (!v || !mediaStream) return;
    let cancelled = false;
    (async () => {
      try {
        v.srcObject = mediaStream;
        await v.play();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        logClientException("ProfileAvatarWebcamDialog:videoPlay", err);
        onFailureMessage(labels.avatarWebcamOpenFailed);
        onOpenChange(false);
      }
    })();
    return () => {
      cancelled = true;
      detachVideo(v);
      queueMicrotask(() => setReady(false));
    };
  }, [open, mediaStream, labels, onFailureMessage, onOpenChange]);

  function capturePhoto() {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    if (vw === 0 || vh === 0) return;
    let w = vw;
    let h = vh;
    const longest = Math.max(vw, vh);
    if (longest > MAX_FRAME_PX) {
      const scale = MAX_FRAME_PX / longest;
      w = Math.round(vw * scale);
      h = Math.round(vh * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopVideoAndTracks(videoRef.current);
        setReady(false);
        onOpenChange(false);
        onPhotoFile(new File([blob], "profile-webcam.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={labels.avatarWebcamTitle}
      stackClassName="z-[250]"
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {labels.avatarWebcamLead}
      </p>
      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-foreground)_88%,black)]">
        <video
          ref={videoRef}
          className="aspect-video max-h-[min(50dvh,22rem)] w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {labels.avatarWebcamCancel}
        </Button>
        <Button type="button" disabled={!ready} onClick={capturePhoto}>
          <Camera className="h-4 w-4 shrink-0" aria-hidden />
          {labels.avatarWebcamCapture}
        </Button>
      </div>
    </Modal>
  );
}
