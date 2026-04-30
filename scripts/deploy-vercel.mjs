#!/usr/bin/env node
/**
 * Deploy a este repo apuntando a un proyecto Vercel por nombre (mapeo en JSON).
 * Requiere `vercel` instalado y sesión iniciada (`vercel login`).
 *
 * Uso:
 *   node scripts/deploy-vercel.mjs golden
 *   node scripts/deploy-vercel.mjs mozarthitos --prod
 *
 * Archivos:
 *   - scripts/vercel-targets.json (golden + placeholders)
 *   - scripts/vercel-targets.local.json (opcional, gitignored; sobrescribe/ampliía destinos)
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TARGETS_PATH = path.join(__dirname, "vercel-targets.json");
const LOCAL_TARGETS_PATH = path.join(__dirname, "vercel-targets.local.json");

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mergeTargets(base, extra) {
  const out = { ...base };
  for (const [key, val] of Object.entries(extra)) {
    if (val && typeof val === "object") {
      out[key] = { ...(out[key] || {}), ...val };
    }
  }
  return out;
}

function parseArgs(argv) {
  const flags = new Set();
  const positionals = [];
  for (const a of argv) {
    if (a.startsWith("-")) flags.add(a);
    else positionals.push(a);
  }
  return {
    target: positionals[0],
    prod: flags.has("--prod") || flags.has("--production"),
    yes: flags.has("-y") || flags.has("--yes"),
  };
}

function printMozarthitosHelp() {
  console.error(`
[mozarthitos] Falta orgId o projectId.

En Vercel:
1. Abrí el proyecto "mozarthitos" (o creá uno y enlazalo al mismo repo si querés).
2. Settings → General → copiá "Project ID" → projectId.
3. Team ID (team_…): Team Settings del equipo dueño del proyecto → General,
   o mirá la URL / la CLI: vercel teams ls

Rellená scripts/vercel-targets.json o creá scripts/vercel-targets.local.json:

{
  "mozarthitos": {
    "orgId": "team_XXXXXXXXXXXXXXXX",
    "projectId": "prj_XXXXXXXXXXXXXXXX"
  }
}
`);
}

function main() {
  const { target, prod, yes } = parseArgs(process.argv.slice(2));
  if (!target || target === "help" || target === "--help" || target === "-h") {
    console.error(`Uso: node scripts/deploy-vercel.mjs <golden|mozarthitos|…> [--prod] [-y]

Sin --prod → preview. Con --prod → producción del proyecto elegido.
`);
    process.exit(target ? 0 : 1);
  }

  const base = loadJson(TARGETS_PATH);
  const local = loadJson(LOCAL_TARGETS_PATH);
  const targets = mergeTargets(base, local);
  const entry = targets[target];

  if (!entry || typeof entry !== "object") {
    console.error(
      `Destino "${target}" no está definido. Claves: ${Object.keys(targets).join(", ") || "(ninguna)"}`,
    );
    process.exit(1);
  }

  const orgId = String(entry.orgId ?? "").trim();
  const projectId = String(entry.projectId ?? "").trim();

  if (!orgId || !projectId) {
    if (target === "mozarthitos") printMozarthitosHelp();
    else {
      console.error(
        `Destino "${target}": completa orgId y projectId en vercel-targets.json o vercel-targets.local.json.`,
      );
    }
    process.exit(1);
  }

  const vercelArgs = ["deploy"];
  if (prod) vercelArgs.push("--prod");
  if (yes) vercelArgs.push("--yes");

  const env = {
    ...process.env,
    VERCEL_ORG_ID: orgId,
    VERCEL_PROJECT_ID: projectId,
  };

  const result = spawnSync("vercel", vercelArgs, {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
    console.error(
      "¿Tenés la CLI? npm i -g vercel   y luego: vercel login",
    );
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
