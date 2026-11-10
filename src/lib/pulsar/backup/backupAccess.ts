export type BackupActorKind = "staff" | "owner" | "login" | "forbidden";

export function backupExportDenial(input: {
  actorKind: BackupActorKind;
  mustChangePassword: boolean;
  passwordOk: boolean;
  passphrase: string;
  passphraseAgain: string;
  dataMode: string | null;
}): string | null {
  if (input.actorKind !== "staff" && input.actorKind !== "owner") return "unauthorized";
  if (input.actorKind === "staff" && input.mustChangePassword) return "password_change_required";
  if (input.passphrase.length < 12) return "passphrase_too_short";
  if (input.passphrase !== input.passphraseAgain) return "passphrase_mismatch";
  if (!input.passwordOk) return "step_up_failed";
  if (input.dataMode !== "shared_schema") return "not_shared_schema";
  return null;
}

export function backupImportDenial(input: {
  actorKind: BackupActorKind;
  mustChangePassword: boolean;
  passwordOk: boolean;
  passphrase: string;
}): string | null {
  if (input.actorKind !== "staff") return "unauthorized";
  if (input.mustChangePassword) return "password_change_required";
  if (input.passphrase.length < 12) return "passphrase_too_short";
  if (!input.passwordOk) return "step_up_failed";
  return null;
}
