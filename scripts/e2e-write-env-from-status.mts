#!/usr/bin/env node
/**
 * Reads __SUPABASE_STATUS_ENV (or stdin) and prints `.env.local.e2e` body.
 * Optional: __E2E_COHORT_ID / __E2E_SECTION_ID from stack-up after seed.
 */
import {
  buildE2eLocalEnvFileContents,
  parseStatusEnv,
} from "../e2e/buildE2eLocalEnvFile";

const raw =
  process.env.__SUPABASE_STATUS_ENV?.trim() ||
  (await new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    const chunks: Buffer[] = [];
    process.stdin.on("data", (c: Buffer) => chunks.push(c));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  }));

if (!raw) {
  console.error("No supabase status env on __SUPABASE_STATUS_ENV or stdin");
  process.exit(1);
}

process.stdout.write(
  buildE2eLocalEnvFileContents(parseStatusEnv(raw), {
    cohortId: process.env.__E2E_COHORT_ID?.trim() || undefined,
    sectionId: process.env.__E2E_SECTION_ID?.trim() || undefined,
  }),
);
