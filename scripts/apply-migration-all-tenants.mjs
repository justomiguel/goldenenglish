#!/usr/bin/env node
/**
 * Same path as apply-migration-all-tenants-pg.mjs.
 * Agents must not apply a product migration with psql per institute.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const child = spawnSync(
  process.execPath,
  [path.join(here, "apply-migration-all-tenants-pg.mjs"), ...process.argv.slice(2)],
  { stdio: "inherit" },
);
process.exit(child.status ?? 1);
