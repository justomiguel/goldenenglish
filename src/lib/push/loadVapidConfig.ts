import "server-only";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { preferTenantValue } from "@/lib/tenant/preferTenantValue";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { type TenantConfig } from "@/lib/tenant/tenantRegistry";

export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  contactEmail: string;
};

export function vapidConfigFromTenant(tenant: TenantConfig | null): VapidConfig | null {
  const publicKey = preferTenantValue(
    tenant?.vapidPublicKey,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  );
  const privateKey = preferTenantValue(tenant?.vapidPrivateKey, process.env.VAPID_PRIVATE_KEY);
  const contactEmail = preferTenantValue(
    tenant?.vapidContactEmail,
    process.env.VAPID_CONTACT_EMAIL,
  );
  if (!publicKey || !privateKey || !contactEmail) return null;
  return { publicKey, privateKey, contactEmail };
}

export function loadVapidConfig(): VapidConfig | null {
  return vapidConfigFromTenant(getAlsTenant());
}

export async function loadRequestVapidConfig(): Promise<VapidConfig | null> {
  const tenant = await resolveRequestTenant();
  return vapidConfigFromTenant(tenant);
}

export function getVapidPublicKey(): string | null {
  const key = preferTenantValue(
    getAlsTenant()?.vapidPublicKey,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  );
  return key || null;
}
