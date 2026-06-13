import "server-only";

export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  contactEmail: string;
};

export function loadVapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const contactEmail = process.env.VAPID_CONTACT_EMAIL?.trim() ?? "";
  if (!publicKey || !privateKey || !contactEmail) return null;
  return { publicKey, privateKey, contactEmail };
}

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}
