import type { Dictionary } from "@/types/i18n";

export type ProfileAvatarChangeFabLabels = Pick<
  Dictionary["dashboard"]["myProfile"],
  | "avatarFabAria"
  | "avatarFabTooltip"
  | "avatarMenuTakePhoto"
  | "avatarMenuUpload"
  | "avatarHint"
  | "avatarSuccess"
  | "avatarError"
  | "avatarTooBig"
  | "avatarInvalidType"
  | "avatarSessionMissing"
  | "avatarProfileMissing"
  | "avatarNoFile"
  | "avatarWebcamTitle"
  | "avatarWebcamLead"
  | "avatarWebcamCapture"
  | "avatarWebcamCancel"
  | "avatarWebcamPermissionDenied"
  | "avatarWebcamOpenFailed"
>;
