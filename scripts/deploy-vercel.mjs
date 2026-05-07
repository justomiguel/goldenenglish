#!/usr/bin/env node
/**
 * Deploy a este repo apuntando a un proyecto Vercel por nombre (mapeo en JSON).
 * Requiere `vercel` instalado y sesión iniciada (`vercel login`).
 *
 * Uso:
 *   node scripts/deploy-vercel.mjs golden
 *   node scripts/deploy-vercel.mjs mozarthitos --prod
 *   node scripts/deploy-vercel.mjs --all --prod
 *   node scripts/deploy-vercel.mjs all --prod --continue-on-error
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
  const positionalTarget = positionals[0];
  const allFlag = flags.has("--all");
  const allPositional = positionalTarget === "all";
  if (allFlag && positionalTarget && positionalTarget !== "all") {
    console.error("No mezclés --all con un target concreto.");
    process.exit(1);
  }
  const all = allFlag || allPositional;
  const target = all ? undefined : positionalTarget;
  return {
    target,
    all,
    prod: flags.has("--prod") || flags.has("--production"),
    yes: flags.has("-y") || flags.has("--yes"),
    continueOnError: flags.has("--continue-on-error"),
  };
}

function printVercelTargetFillHelp(target, projectNameHint) {
  const name = projectNameHint || target;
  console.error(`
[${target}] Falta orgId o projectId.

En Vercel:
1. Abrí el proyecto "${name}" (o creá uno enlazado a este repo).
2. Settings → General → copiá "Project ID" → projectId.
3. Team ID (team_…): Team Settings del equipo → General, o vercel teams ls

Rellená scripts/vercel-targets.json o scripts/vercel-targets.local.json:

{
  "${target}": {
    "orgId": "team_XXXXXXXXXXXXXXXX",
    "projectId": "prj_XXXXXXXXXXXXXXXX"
  }
}
`);
}

function runVercelDeploy({ orgId, projectId, prod, yes }) {
  const vercelArgs = ["deploy"];
  if (prod) vercelArgs.push("--prod");
  if (yes) vercelArgs.push("--yes");
  const env = {
    ...process.env,
    VERCEL_ORG_ID: orgId,
    VERCEL_PROJECT_ID: projectId,
  };
  return spawnSync("vercel", vercelArgs, {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: false,
  });
}

function deployOneTarget(target, entry, { prod, yes }) {
  const orgId = String(entry.orgId ?? "").trim();
  const projectId = String(entry.projectId ?? "").trim();

  if (!orgId || !projectId) {
    printVercelTargetFillHelp(target, String(entry.projectName ?? "").trim());
    return { ok: false, code: 1, reason: "missing_ids" };
  }

  const result = runVercelDeploy({ orgId, projectId, prod, yes });
  if (result.error) {
    console.error(result.error.message);
    console.error("¿Tenés la CLI? npm i -g vercel   y luego: vercel login");
    return { ok: false, code: 1, reason: "spawn" };
  }
  const code = result.status ?? 1;
  return { ok: code === 0, code, reason: code === 0 ? "ok" : "vercel" };
}

function deployAllTargets(targets, { prod, yes, continueOnError }) {
  const names = Object.keys(targets).sort();
  const skipped = [];
  let ran = 0;
  let failed = 0;

  for (const name of names) {
    const entry = targets[name];
    if (!entry || typeof entry !== "object") continue;
    const orgId = String(entry.orgId ?? "").trim();
    const projectId = String(entry.projectId ?? "").trim();
    if (!orgId || !projectId) {
      skipped.push(name);
      console.error(`\n[deploy-all] Omitiendo "${name}": falta orgId o projectId`);
      continue;
    }

    ran++;
    const label = prod ? "production" : "preview";
    console.error(`\n========== deploy ${label} → ${name} ==========\n`);
    const { ok, code } = deployOneTarget(name, entry, { prod, yes });

    if (!ok) {
      failed++;
      console.error(`\n[deploy-all] Falló "${name}" (código ${code}).\n`);
      if (!continueOnError) {
        process.exit(code);
      }
    }
  }

  if (skipped.length) {
    console.error(`\n[deploy-all] Targets omitidos (sin IDs): ${skipped.join(", ")}`);
  }
  if (ran === 0) {
    console.error("\n[deploy-all] No hay targets desplegables (revisá vercel-targets*.json).");
    process.exit(1);
  }
  if (failed > 0) {
    process.exit(1);
  }
}

function printHelp(exitCode) {
  console.error(`Uso:
  node scripts/deploy-vercel.mjs <golden|mozarthitos|…> [--prod] [-y]
  node scripts/deploy-vercel.mjs --all [--prod] [-y] [--continue-on-error]
  node scripts/deploy-vercel.mjs all [--prod] …

Sin --prod → preview. Con --prod → producción del proyecto elegido.
--all recorre todas las claves de scripts/vercel-targets.json (+ .local).
`);
  process.exit(exitCode);
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const { target, all, prod, yes, continueOnError } = parsed;

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp(0);
  }

  if (all) {
    const base = loadJson(TARGETS_PATH);
    const local = loadJson(LOCAL_TARGETS_PATH);
    const targets = mergeTargets(base, local);
    deployAllTargets(targets, { prod, yes, continueOnError });
    return;
  }

  if (!target || target === "help") {
    printHelp(1);
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

  const out = deployOneTarget(target, entry, { prod, yes });
  process.exit(out.ok ? 0 : out.code);
}

main();
