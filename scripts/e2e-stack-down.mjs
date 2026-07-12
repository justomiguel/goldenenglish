#!/usr/bin/env node
/** Stop local Supabase containers used by the isolated e2e stack. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("supabase", ["stop"], { cwd: ROOT, stdio: "inherit" });
process.exit(r.status ?? 1);
