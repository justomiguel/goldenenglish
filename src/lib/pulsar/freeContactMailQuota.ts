export const FREE_CONTACT_MAIL_QUOTA = 50;

export function reserveFreeContactCount(
  sent: number,
  quota: number,
): { status: "reserved"; sent: number } | { status: "quota"; sent: number } {
  if (sent >= quota) return { status: "quota", sent };
  return { status: "reserved", sent: sent + 1 };
}

export function releaseFreeContactCount(sent: number): number {
  return Math.max(0, sent - 1);
}
