#!/usr/bin/env node
/**
 * Uploads `e2e/fixtures/receipt-tiny.png` for the tour receipt fixture after seed.
 * Requires __SUPABASE_STATUS_ENV + __E2E_STUDENT_ID (from e2e-stack-up.mjs).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parseStatusEnv } from "../e2e/buildE2eLocalEnvFile";
import { tourReceiptStoragePath } from "../e2e/tourReceiptFixture";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FIXTURE = path.join(ROOT, "e2e/fixtures/receipt-tiny.png");

const statusRaw = process.env.__SUPABASE_STATUS_ENV?.trim();
const studentId = process.env.__E2E_STUDENT_ID?.trim();

if (!statusRaw || !studentId) {
  console.error("e2e-upload-tour-receipt: missing __SUPABASE_STATUS_ENV or __E2E_STUDENT_ID");
  process.exit(1);
}

const status = parseStatusEnv(statusRaw);
const apiUrl =
  status.API_URL?.trim() ||
  status.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  status.SUPABASE_URL?.trim() ||
  "";
const serviceKey =
  status.SERVICE_ROLE_KEY?.trim() ||
  status.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  "";

if (!apiUrl || !serviceKey) {
  console.error("e2e-upload-tour-receipt: status env missing API_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const objectPath = tourReceiptStoragePath(studentId);
const bytes = readFileSync(FIXTURE);
const supabase = createClient(apiUrl, serviceKey);

const { error } = await supabase.storage.from("payment-receipts").upload(objectPath, bytes, {
  contentType: "image/png",
  upsert: true,
});

if (error) {
  console.error(`e2e-upload-tour-receipt: upload failed — ${error.message}`);
  process.exit(1);
}

console.log(`   Tour receipt object: ${objectPath}`);
