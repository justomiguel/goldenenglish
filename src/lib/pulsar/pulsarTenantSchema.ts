import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { mergeTenantPreviewHosts } from "@/lib/tenant/pulsarSubdomain";
import {
  getPulsarHosts,
  isPulsarHost,
  normalizeHost,
  PULSAR_SLUG,
} from "@/lib/tenant/tenantRegistry";

export type ValidatedPulsarTenantInput = Omit<PulsarTenantRecord, "updatedAt">;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62})$/u;

function optString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isValid32ByteBase64Key(raw: string): boolean {
  try {
    const buf = Buffer.from(raw.trim(), "base64");
    return buf.byteLength === 32;
  } catch {
    return false;
  }
}

export function validatePulsarTenantInput(
  input: unknown,
  existingTenants: readonly PulsarTenantRecord[],
  editingSlug?: string,
): { ok: true; value: ValidatedPulsarTenantInput } | { ok: false; errorCode: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, errorCode: "invalid_input" };
  }
  const raw = input as Record<string, unknown>;
  const slug = optString(raw.slug)?.toLowerCase() ?? "";
  if (!slug || slug === PULSAR_SLUG || !SLUG_RE.test(slug)) {
    return { ok: false, errorCode: "invalid_slug" };
  }
  if (!editingSlug && existingTenants.some((t) => t.slug === slug)) {
    return { ok: false, errorCode: "duplicate_slug" };
  }

  const displayName = optString(raw.displayName);
  if (!displayName) {
    return { ok: false, errorCode: "missing_display_name" };
  }

  const rawHosts = Array.isArray(raw.hosts)
    ? raw.hosts
    : typeof raw.hosts === "string"
      ? raw.hosts.split(/[\n,]+/)
      : [];

  const hosts = Array.from(
    new Set(
      rawHosts
        .filter((h): h is string => typeof h === "string")
        .map((h) => normalizeHost(h))
        .filter((h) => h.length > 0),
    ),
  );
  if (hosts.length === 0) {
    return { ok: false, errorCode: "missing_hosts" };
  }

  const mergedHosts = mergeTenantPreviewHosts(hosts, slug, getPulsarHosts());

  for (const host of mergedHosts) {
    if (isPulsarHost(host)) {
      return { ok: false, errorCode: "reserved_pulsar_host" };
    }
    const owner = existingTenants.find(
      (t) => t.slug !== (editingSlug ?? "") && t.hosts.some((c) => normalizeHost(c) === host),
    );
    if (owner) {
      return { ok: false, errorCode: "duplicate_host" };
    }
  }

  const supabaseUrl = optString(raw.supabaseUrl);
  const supabaseAnonKey = optString(raw.supabaseAnonKey);
  const supabaseServiceRoleKey = optString(raw.supabaseServiceRoleKey);
  if (!supabaseUrl || !isValidHttpUrl(supabaseUrl) || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return { ok: false, errorCode: "invalid_supabase_credentials" };
  }

  const publicUrl = optString(raw.publicUrl);
  if (publicUrl && !isValidHttpUrl(publicUrl)) {
    return { ok: false, errorCode: "invalid_public_url" };
  }

  const paymentKey = optString(raw.paymentGatewaySecretEncryptionKey);
  if (paymentKey && !isValid32ByteBase64Key(paymentKey)) {
    return { ok: false, errorCode: "invalid_payment_key" };
  }

  return {
    ok: true,
    value: {
      slug,
      displayName,
      isEnabled: raw.isEnabled !== false,
      hosts: mergedHosts,
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceRoleKey,
      databaseUrl: optString(raw.databaseUrl),
      brandThemeSlug: optString(raw.brandThemeSlug),
      mailTenant: optString(raw.mailTenant),
      resendFromEmail: optString(raw.resendFromEmail),
      resendApiKey: optString(raw.resendApiKey),
      publicUrl,
      paymentGatewaySecretEncryptionKey: paymentKey,
      whatsappAccessToken: optString(raw.whatsappAccessToken),
      whatsappPhoneNumberId: optString(raw.whatsappPhoneNumberId),
      whatsappClassReminderTemplateName: optString(raw.whatsappClassReminderTemplateName),
      vapidPublicKey: optString(raw.vapidPublicKey),
      vapidPrivateKey: optString(raw.vapidPrivateKey),
      vapidContactEmail: optString(raw.vapidContactEmail),
      googleMapsApiKey: optString(raw.googleMapsApiKey),
      googleMapsMapId: optString(raw.googleMapsMapId),
      kvRestApiUrl: optString(raw.kvRestApiUrl),
      kvRestApiToken: optString(raw.kvRestApiToken),
      debugLogin: Boolean(raw.debugLogin),
      skipInitialSiteSetup: Boolean(raw.skipInitialSiteSetup),
    },
  };
}

export function validatePulsarPlatformHostsInput(
  rawHostsInput: unknown,
  existingTenants: readonly PulsarTenantRecord[],
): { ok: true; hosts: string[] } | { ok: false; errorCode: string } {
  const rawHosts = Array.isArray(rawHostsInput)
    ? rawHostsInput
    : typeof rawHostsInput === "string"
      ? rawHostsInput.split(/[\n,]+/)
      : [];

  const hosts = Array.from(
    new Set(
      rawHosts
        .filter((h): h is string => typeof h === "string")
        .map((h) => normalizeHost(h))
        .filter((h) => h.length > 0),
    ),
  );

  if (hosts.length === 0) {
    return { ok: false, errorCode: "missing_hosts" };
  }

  for (const host of hosts) {
    const owner = existingTenants.find((t) =>
      t.hosts.some((candidate) => normalizeHost(candidate) === host),
    );
    if (owner) {
      return { ok: false, errorCode: "duplicate_host" };
    }
  }

  return { ok: true, hosts };
}
