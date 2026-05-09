#!/usr/bin/env node
/**
 * Pull env desde Vercel (golden | mozarthitos | espaciozenit | nago): .vercel/project.json temporal.
 * Sensitive en Production/Preview no es legible por CLI → KEY="".
 * https://vercel.com/docs/environment-variables/sensitive-environment-variables
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { summarizeDotEnv } from "./pull-vercel-env-summarize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TARGETS_PATH = path.join(__dirname, "vercel-targets.json");
const LOCAL_TARGETS_PATH = path.join(__dirname, "vercel-targets.local.json");

const OUT_FILES = {
  golden: path.join(ROOT, ".env.local.golden"),
  mozarthitos: path.join(ROOT, ".env.local.mozarthitos"),
  espaciozenit: path.join(ROOT, ".env.local.espaciozenit"),
  nago: path.join(ROOT, ".env.local.nago"),
};

const VERCEL_DIR = path.join(ROOT, ".vercel");
const PROJECT_JSON = path.join(VERCEL_DIR, "project.json");

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
  /** @type {'development' | 'preview' | 'production' | null} */
  let environment = null;
  let yes = false;
  const positionals = [];

  for (const a of argv) {
    if (a === "-y" || a === "--yes") yes = true;
    else if (a === "--production" || a === "--prod") environment = "production";
    else if (a === "--preview") environment = "preview";
    else if (a === "--development") environment = "development";
    else if (a.startsWith("--environment=")) {
      const raw = a.slice("--environment=".length).trim();
      environment = /** @type {'development' | 'preview' | 'production'} */ (raw);
    } else if (!a.startsWith("-")) positionals.push(a);
  }

  if (
    environment !== null &&
    environment !== "development" &&
    environment !== "preview" &&
    environment !== "production"
  ) {
    console.error(`Entorno inválido: ${environment}`);
    process.exit(1);
  }

  return { target: positionals[0], environment, yes };
}

/** @param {unknown} v */
function assertPullEnvironment(v) {
  if (v === undefined || v === null || v === "") return null;
  if (v !== "development" && v !== "preview" && v !== "production") {
    console.error(`envPullEnvironment inválido: ${String(v)}`);
    process.exit(1);
  }
  return /** @type {'development' | 'preview' | 'production'} */ (v);
}

/**
 * @param {string} orgId
 * @param {string} projectId
 * @param {string | undefined} projectName
 */
function temporaryProjectLink(orgId, projectId, projectName) {
  const previous = fs.existsSync(PROJECT_JSON)
    ? fs.readFileSync(PROJECT_JSON, "utf8")
    : null;

  fs.mkdirSync(VERCEL_DIR, { recursive: true });
  const payload = /** @type {Record<string, string>} */ ({ orgId, projectId });
  if (projectName) payload.projectName = projectName;
  fs.writeFileSync(PROJECT_JSON, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    restore() {
      try {
        if (previous !== null) {
          fs.writeFileSync(PROJECT_JSON, previous, "utf8");
          return;
        }
        fs.unlinkSync(PROJECT_JSON);
      } catch {
        /* ignore */
      }
      try {
        if (fs.existsSync(VERCEL_DIR) && fs.readdirSync(VERCEL_DIR).length === 0) {
          fs.rmdirSync(VERCEL_DIR);
        }
      } catch {
        /* ignore */
      }
    },
  };
}

function usage() {
  console.error(`pull-vercel-env: golden|mozarthitos|espaciozenit [--production|--preview|--development] [-y]
Sensitive en Prod/Preview → CLI deja ""; usar Development sin Sensitive o pegar desde dashboard.
`);
}

function main() {
  const argv = process.argv.slice(2);
  if (
    argv.length === 0 ||
    argv[0] === "help" ||
    argv[0] === "--help" ||
    argv[0] === "-h"
  ) {
    usage();
    process.exit(argv.length ? 0 : 1);
  }

  const { target, environment: cliEnvironment, yes } = parseArgs(argv);
  if (!target || !(target in OUT_FILES)) {
    console.error(`Destino inválido: ${target ?? "(vacío)"}`);
    usage();
    process.exit(1);
  }

  const targets = mergeTargets(loadJson(TARGETS_PATH), loadJson(LOCAL_TARGETS_PATH));
  const entry = targets[target];

  if (!entry || typeof entry !== "object") {
    console.error(`Destino "${target}" no está en vercel-targets.`);
    process.exit(1);
  }

  const orgId = String(entry.orgId ?? "").trim();
  const projectId = String(entry.projectId ?? "").trim();
  const projectNameRaw = String(entry.projectName ?? "").trim();
  const projectName = projectNameRaw || undefined;

  if (!orgId || !projectId) {
    console.error(`Completa orgId y projectId para "${target}".`);
    process.exit(1);
  }

  const environment =
    cliEnvironment ?? assertPullEnvironment(entry.envPullEnvironment) ?? "development";

  const outFile = path.resolve(
    OUT_FILES[/** @type {'golden'|'mozarthitos'|'espaciozenit'} */ (target)],
  );
  const vercelArgs = ["env", "pull", outFile, "--environment", environment];
  if (yes) vercelArgs.push("--yes");

  console.error(
    `→ ${target} | remote=${environment} | project=${projectId}${projectName ? ` (${projectName})` : ""}`,
  );
  console.error(`→ escribiendo ${path.basename(outFile)} (ruta absoluta)`);

  const link = temporaryProjectLink(orgId, projectId, projectName);
  const useShell = process.platform === "win32";
  let result;
  try {
    result = spawnSync("vercel", vercelArgs, {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      shell: useShell,
    });
  } finally {
    link.restore();
  }

  if (!result || result.error) {
    console.error(result?.error?.message ?? "No se pudo ejecutar vercel (¿PATH / instalación?)");
    process.exit(1);
  }

  const code = result.status ?? 1;
  if (code !== 0) process.exit(code);

  const { count, sensitivePlaceholders, appKeys, appKeysEmpty } = summarizeDotEnv(outFile);
  console.error(`→ ${count} líneas KEY=… en ${path.basename(outFile)}.`);

  if (appKeys > 0 && appKeysEmpty === appKeys) {
    console.error(
      `⚠ Las ${appKeys} variables de aplicación (Supabase, URLs, API keys, etc.) vienen como KEY="".`,
    );
    console.error(
      `  En Production/Preview, Vercel no devuelve el valor de variables “Sensitive” al CLI (solo el nombre).`,
    );
    console.error(
      `  Opciones: (1) Duplicar esas claves en Development sin Sensitive y tirar pull con --development. (2) Pegar valores desde el dashboard.`,
    );
    console.error(`  https://vercel.com/docs/environment-variables/sensitive-environment-variables`);
  } else if (sensitivePlaceholders.length) {
    console.error(`⚠ Sin valores descargables para: ${sensitivePlaceholders.join(", ")}.`);
    console.error(`  Suele ser Sensitive en ${environment}: el CLI no puede leer el valor.`);
    console.error(`  Development sin Sensitive o copiar desde dashboard.`);
    console.error(`  https://vercel.com/docs/environment-variables/sensitive-environment-variables`);
  }

  process.exit(0);
}

main();
