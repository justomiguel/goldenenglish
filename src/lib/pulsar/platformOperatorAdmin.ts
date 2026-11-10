import pg from "pg";
import { logServerActionException, logServerWarn } from "@/lib/logging/serverActionLog";

/** Operator admin on every generated institute. See rule 52. */
export const PLATFORM_OPERATOR_ADMIN_EMAIL = "justomiguelvargas@gmail.com";

const SCHEMA_NAME = /^(public|tenant_[a-z0-9_]{1,50})$/;
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";

export type SqlClient = {
  query: (
    text: string,
    params?: readonly unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

function assertSchema(schema: string): string {
  if (!SCHEMA_NAME.test(schema)) {
    throw new Error("invalid_schema");
  }
  return schema;
}

/** Sets the operator password on auth.users. Does not write a profile. */
export async function applyOperatorAuthPassword(client: SqlClient, password: string): Promise<string> {
  if (!password) {
    throw new Error("operator_admin_missing_password");
  }
  const email = PLATFORM_OPERATOR_ADMIN_EMAIL;
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions");

  const existing = await client.query(
    "SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1",
    [email],
  );
  let userId = typeof existing.rows[0]?.id === "string" ? existing.rows[0].id : null;

  if (userId) {
    await client.query(
      `UPDATE auth.users
       SET encrypted_password = extensions.crypt($2::text, extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           instance_id = $3::uuid,
           aud = 'authenticated',
           role = 'authenticated',
           is_sso_user = false,
           is_anonymous = false,
           confirmation_token = COALESCE(confirmation_token, ''),
           recovery_token = COALESCE(recovery_token, ''),
           email_change = COALESCE(email_change, ''),
           email_change_token_new = COALESCE(email_change_token_new, ''),
           email_change_token_current = COALESCE(email_change_token_current, ''),
           reauthentication_token = COALESCE(reauthentication_token, ''),
           updated_at = now()
       WHERE id = $1::uuid`,
      [userId, password, INSTANCE_ID],
    );
  } else {
    const inserted = await client.query(
      `INSERT INTO auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         confirmation_token, recovery_token, email_change, email_change_token_new,
         is_sso_user, is_anonymous, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
       ) VALUES (
         $3::uuid, gen_random_uuid(), 'authenticated', 'authenticated', $1,
         extensions.crypt($2::text, extensions.gen_salt('bf')), now(),
         '', '', '', '',
         false, false,
         '{"provider":"email","providers":["email"]}'::jsonb,
         '{"first_name":"Justo","last_name":"Vargas","dni_or_passport":"PLATFORM-OPERATOR"}'::jsonb,
         now(), now()
       )
       RETURNING id`,
      [email, password, INSTANCE_ID],
    );
    const created = inserted.rows[0]?.id;
    if (typeof created !== "string") {
      throw new Error("operator_admin_missing_id");
    }
    userId = created;
  }

  await client.query(
    `INSERT INTO auth.identities (
       id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
     )
     SELECT gen_random_uuid(), $1::uuid,
            jsonb_build_object('sub', $1::text, 'email', $2::text),
            'email', $1::text, now(), now(), now()
     WHERE NOT EXISTS (
       SELECT 1 FROM auth.identities WHERE user_id = $1::uuid AND provider = 'email'
     )`,
    [userId, email],
  );
  return userId;
}

/**
 * Creates the operator auth user when missing, sets the password,
 * and upserts an admin profile in `schema`.
 */
export async function ensurePlatformOperatorAdmin(
  client: SqlClient,
  schema: string,
  password: string | null,
): Promise<void> {
  const safeSchema = assertSchema(schema);
  if (!password) {
    throw new Error("operator_admin_missing_password");
  }
  const userId = await applyOperatorAuthPassword(client, password);
  await client.query(
    `INSERT INTO ${safeSchema}.profiles (id, role, first_name, last_name, dni_or_passport)
     VALUES ($1::uuid, 'admin', 'Justo', 'Vargas', 'PLATFORM-OPERATOR')
     ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now()`,
    [userId],
  );
}

export async function ensurePlatformOperatorAdminOnDatabase(
  databaseUrl: string,
  schema: string,
  password: string | null,
): Promise<{ ok: true } | { ok: false; errorCode: "operator_admin_failed" }> {
  if (!password) {
    await logServerWarn("ensurePlatformOperatorAdmin", { schema, reason: "missing_operator_password" });
    return { ok: false, errorCode: "operator_admin_failed" };
  }
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await ensurePlatformOperatorAdmin(client, schema, password);
    return { ok: true };
  } catch (err) {
    logServerActionException("ensurePlatformOperatorAdmin", err, { schema });
    return { ok: false, errorCode: "operator_admin_failed" };
  } finally {
    await client.end().catch(() => undefined);
  }
}
