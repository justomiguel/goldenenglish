/**
 * Validate `.env.local` `TENANTS_CONFIG_JSON` when that file exists.
 * Does not print secret values.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readEnvFile } from "./migrate-public-assets-lib.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED_STRINGS = [
  "slug",
  "supabaseUrl",
  "supabaseAnonKey",
  "supabaseServiceRoleKey",
  "paymentGatewaySecretEncryptionKey",
  "kvRestApiUrl",
  "kvRestApiToken",
];

/**
 * @param {string} filePath
 * @returns {string[]}
 */
export function verifyTenantsJsonFile(filePath) {
  /** @type {string[]} */
  const errors = [];
  if (!fs.existsSync(filePath)) return errors;
  const env = readEnvFile(filePath);
  const raw = env.TENANTS_CONFIG_JSON?.trim();
  if (!raw) {
    errors.push(`${path.basename(filePath)} is missing TENANTS_CONFIG_JSON`);
    return errors;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    errors.push("TENANTS_CONFIG_JSON is not valid JSON");
    return errors;
  }
  if (!Array.isArray(data) || data.length === 0) {
    errors.push("TENANTS_CONFIG_JSON must be a non-empty array");
    return errors;
  }
  for (const row of data) {
    const slug = row && typeof row.slug === "string" ? row.slug : "(missing slug)";
    if (!row || typeof row !== "object") {
      errors.push("TENANTS_CONFIG_JSON contains a row that is not an object");
      continue;
    }
    if (!Array.isArray(row.hosts) || row.hosts.length === 0) {
      errors.push(`tenant ${slug} is missing hosts`);
    }
    for (const field of REQUIRED_STRINGS) {
      const value = row[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push(`tenant ${slug} is missing ${field}`);
      }
    }
  }
  return errors;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const file = path.join(ROOT, ".env.local");
  const errors = verifyTenantsJsonFile(file);
  if (!fs.existsSync(file)) {
    console.log("skip: .env.local is absent");
  } else if (errors.length) {
    for (const msg of errors) console.error(msg);
    process.exit(1);
  } else {
    console.log("TENANTS_CONFIG_JSON ok");
  }
}
