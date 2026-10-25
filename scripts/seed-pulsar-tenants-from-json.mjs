#!/usr/bin/env node
/**
 * Seeds `public.platform_tenants` (and optionally a `public.platform_staff` email)
 * in the Pulsar Supabase project from `TENANTS_CONFIG_JSON` in `.env.local`.
 *
 * Usage:
 *   node scripts/seed-pulsar-tenants-from-json.mjs [--staff-email=tu@pulsarlab.cl]
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./migrate-public-assets-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const DEFAULT_DISPLAY_NAMES = {
  espaciozenit: "Espacio Zenit",
  golden: "Golden Institute",
  liora: "Liora Studio",
  mimundo: "Jardín Mi Mundo",
  mozarthitos: "Mozarthitos",
  nago: "Capoeira Nagô Chile",
};

function strOrNull(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

async function main() {
  const fileEnv = existsSync(ENV_LOCAL) ? readEnvFile(ENV_LOCAL) : {};
  const pulsarUrl = strOrNull(process.env.PULSAR_SUPABASE_URL ?? fileEnv.PULSAR_SUPABASE_URL);
  const pulsarServiceKey = strOrNull(
    process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.PULSAR_SUPABASE_SERVICE_ROLE_KEY,
  );
  const rawJson = strOrNull(process.env.TENANTS_CONFIG_JSON ?? fileEnv.TENANTS_CONFIG_JSON);

  if (!pulsarUrl || !pulsarServiceKey) {
    console.error("Faltan PULSAR_SUPABASE_URL o PULSAR_SUPABASE_SERVICE_ROLE_KEY en .env.local.");
    process.exit(1);
  }
  if (!rawJson) {
    console.error("Falta TENANTS_CONFIG_JSON en .env.local para sembrar platform_tenants.");
    process.exit(1);
  }

  const tenants = JSON.parse(rawJson);
  if (!Array.isArray(tenants) || tenants.length === 0) {
    console.error("TENANTS_CONFIG_JSON debe ser un array no vacío.");
    process.exit(1);
  }

  const client = createClient(pulsarUrl, pulsarServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = tenants.map((t) => {
    const slug = String(t.slug).trim().toLowerCase();
    return {
      slug,
      display_name: t.displayName || DEFAULT_DISPLAY_NAMES[slug] || slug.toUpperCase(),
      is_enabled: t.isEnabled !== false,
      hosts: t.hosts,
      supabase_url: t.supabaseUrl,
      supabase_anon_key: t.supabaseAnonKey,
      supabase_service_role_key: t.supabaseServiceRoleKey,
      database_url: strOrNull(t.databaseUrl),
      brand_theme_slug: strOrNull(t.brandThemeSlug),
      mail_tenant: strOrNull(t.mailTenant),
      resend_from_email: strOrNull(t.resendFromEmail),
      resend_api_key: strOrNull(t.resendApiKey),
      public_url: strOrNull(t.publicUrl),
      payment_gateway_secret_encryption_key: strOrNull(t.paymentGatewaySecretEncryptionKey),
      whatsapp_access_token: strOrNull(t.whatsappAccessToken),
      whatsapp_phone_number_id: strOrNull(t.whatsappPhoneNumberId),
      whatsapp_class_reminder_template_name: strOrNull(t.whatsappClassReminderTemplateName),
      vapid_public_key: strOrNull(t.vapidPublicKey),
      vapid_private_key: strOrNull(t.vapidPrivateKey),
      vapid_contact_email: strOrNull(t.vapidContactEmail),
      google_maps_api_key: strOrNull(t.googleMapsApiKey),
      google_maps_map_id: strOrNull(t.googleMapsMapId),
      kv_rest_api_url: strOrNull(t.kvRestApiUrl),
      kv_rest_api_token: strOrNull(t.kvRestApiToken),
      debug_login: Boolean(t.debugLogin),
      skip_initial_site_setup: Boolean(t.skipInitialSiteSetup),
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await client.from("platform_tenants").upsert(rows, { onConflict: "slug" });
  if (error) {
    console.error("Error al sembrar platform_tenants:", error.message);
    process.exit(1);
  }
  console.log(`✓ Sembrados ${rows.length} tenants en public.platform_tenants.`);

  const staffArg = process.argv.find((a) => a.startsWith("--staff-email="));
  const staffEmail = staffArg ? staffArg.slice("--staff-email=".length).trim().toLowerCase() : "";
  if (staffEmail) {
    const { data: usersData, error: listErr } = await client.auth.admin.listUsers();
    if (listErr) {
      console.error("No se pudo listar auth.users en Pulsar:", listErr.message);
      process.exit(1);
    }
    const found = (usersData?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === staffEmail,
    );
    if (!found) {
      console.error(`No existe un usuario con email ${staffEmail} en Pulsar Auth.`);
      process.exit(1);
    }
    const { error: staffErr } = await client
      .from("platform_staff")
      .upsert({ user_id: found.id, email: staffEmail }, { onConflict: "user_id" });
    if (staffErr) {
      console.error("Error al registrar platform_staff:", staffErr.message);
      process.exit(1);
    }
    console.log(`✓ Registrado ${staffEmail} en public.platform_staff.`);
  }
}

await main();
