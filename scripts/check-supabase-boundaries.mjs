#!/usr/bin/env node
/**
 * Enforces rule 12: @supabase/ssr and non-type @supabase/supabase-js imports
 * only under src/lib/supabase/ (tests excluded).
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** @type {string[]} */
const errors = [];

function scanFile(rel) {
  if (!rel.startsWith("src/")) return;
  if (rel.includes("__tests__/") || rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) {
    return;
  }
  if (rel.startsWith("src/lib/supabase/")) return;

  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return;
  const text = readFileSync(abs, "utf8");
  if (text.includes("@supabase/ssr")) {
    errors.push(`${rel}: @supabase/ssr is only allowed under src/lib/supabase/`);
  }
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("@supabase/supabase-js")) continue;
    if (/import\s+type\s+/.test(line)) continue;
    if (/import\s*\{[^}]*\}\s*from\s*["']@supabase\/supabase-js["']/.test(line)) {
      errors.push(
        `${rel}:${i + 1}: value import from @supabase/supabase-js — use src/lib/supabase or import type only`,
      );
    }
  }
}

let files;
try {
  files = execSync("git ls-files src", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => /\.(tsx?)$/.test(f));
} catch {
  files = [];
}

for (const f of files) {
  scanFile(f);
}

if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`);
  process.exit(1);
}
