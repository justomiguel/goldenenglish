export function trialConvertInviteIsLive(row: {
  trialConvertToken?: string | null;
  trialConvertExpiresAt?: string | null;
}): boolean {
  return (
    Boolean(row.trialConvertToken) &&
    Boolean(row.trialConvertExpiresAt) &&
    new Date(String(row.trialConvertExpiresAt)).getTime() > Date.now()
  );
}
