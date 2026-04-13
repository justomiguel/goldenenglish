import { useCallback, useState } from "react";
import { requestUserFacingVideoStream } from "@/lib/client/requestUserFacingVideoStream";

export function useProfileAvatarWebcam(
  permissionDeniedCopy: string,
  openFailedCopy: string,
  onErrorBanner: (message: string) => void,
  openNativeCameraFallback: () => void,
) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    }
  }, []);

  const requestWebcam = useCallback(() => {
    requestUserFacingVideoStream()
      .then((s) => {
        setStream(s);
        setOpen(true);
      })
      .catch((e: unknown) => {
        const name =
          e && typeof e === "object" && "name" in e ? String((e as { name: string }).name) : "";
        const denied =
          name === "NotAllowedError" ||
          name === "PermissionDismissedError" ||
          name === "SecurityError";
        onErrorBanner(denied ? permissionDeniedCopy : openFailedCopy);
        openNativeCameraFallback();
      });
  }, [onErrorBanner, openFailedCopy, openNativeCameraFallback, permissionDeniedCopy]);

  return { webcamOpen: open, webcamStream: stream, handleWebcamOpenChange: handleOpenChange, requestWebcam };
}
