/**
 * Requests a front-facing camera stream. Invoke the returned promise from a click
 * (or other user activation) so the first getUserMedia() runs in that same turn.
 */
export function requestUserFacingVideoStream(): Promise<MediaStream> {
  const g = navigator.mediaDevices?.getUserMedia;
  if (!g) {
    const err = new Error("no-getUserMedia");
    (err as Error & { code?: string }).code = "NO_GET_USER_MEDIA";
    return Promise.reject(err);
  }
  return g.call(navigator.mediaDevices, {
    video: { facingMode: { ideal: "user" } },
    audio: false,
  }).catch(() => g.call(navigator.mediaDevices, { video: true, audio: false }));
}
