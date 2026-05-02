import type { ProfileAvatarChangeFabLabels } from "@/components/molecules/profileAvatarChangeFabLabels";
import {
  fillProfileAvatarMaxMbTemplate,
} from "@/lib/profile/avatarUploadLimits";
import type { ProfileAvatarErrorKey } from "@/lib/profile/uploadProfileAvatar";

export function messageForProfileAvatarError(
  key: ProfileAvatarErrorKey,
  labels: ProfileAvatarChangeFabLabels,
): string {
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
