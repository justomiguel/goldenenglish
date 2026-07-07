#!/usr/bin/env node
/**
 * Elige entorno local (golden | mozarthitos | espaciozenit | nago), copia el archivo prefijado a `.env.local`
 * y ejecuta `next dev`. Next solo lee `.env.local`; así evitamos deps extra (dotenv-cli).
 *
 * Archivos (gitignored): `.env.local.golden`, `.env.local.mozarthitos`, `.env.local.espaciozenit`, `.env.local.nago`
 * Sin TTY (CI): usa `GE_DEV_TARGET=<target>` o `--target=…`.
 */
import { spawn } from "node:child_process";
import { appendFileSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TARGETS = {
  golden: {
    label: "golden — Golden English (proyecto principal)",
    file: path.join(ROOT, ".env.local.golden"),
  },
  mozarthitos: {
    label: "mozarthitos — preview / deploy mozarthitos",
    file: path.join(ROOT, ".env.local.mozarthitos"),
  },
  espaciozenit: {
    label: "espaciozenit — preview / deploy Espacio Zenit",
    file: path.join(ROOT, ".env.local.espaciozenit"),
  },
  nago: {
    label: "nago — preview / deploy Capoeira Nago",
    file: path.join(ROOT, ".env.local.nago"),
  },
  mimundo: {
    label: "mimundo — preview / deploy Jardín Materno Infantil Mi Mundo",
    file: path.join(ROOT, ".env.local.mimundo"),
  },
};
/** Targets que deben pinchar `SITE_BRAND_THEME_SLUG` al slug del tenant (ver .env.example). */
const BRAND_THEME_TARGETS = new Set(["mozarthitos", "espaciozenit", "nago"]);

const VALID_TARGETS = Object.keys(TARGETS);

const OUT_LOCAL = path.join(ROOT, ".env.local");

/** Supabase session cookies can exceed Node's default HTTP header limit in dev. */
function envWithDevHttpHeaders(env) {
  const extra = "--max-http-header-size=65536";
  const cur = (env.NODE_OPTIONS ?? "").trim();
  if (/\b--max-http-header-size=\d+\b/.test(cur)) {
    return { ...env };
  }
  const NODE_OPTIONS = cur ? `${cur} ${extra}` : extra;
  return { ...env, NODE_OPTIONS };
}

function parseTarget(argv, envTarget) {
  const fromEnv = (envTarget || "").trim().toLowerCase();
  if (VALID_TARGETS.includes(fromEnv)) return fromEnv;

  for (const a of argv) {
    if (a === "--golden") return "golden";
    if (a === "--mozarthitos") return "mozarthitos";
    if (a === "--espaciozenit") return "espaciozenit";
    if (a === "--nago") return "nago";
    if (a === "--mimundo") return "mimundo";
    const m = /^--target=(.+)$/.exec(a);
    if (m) {
      const t = m[1].trim().toLowerCase();
      if (VALID_TARGETS.includes(t)) return t;
      console.error(`Valor inválido para --target: ${m[1]} (usa ${VALID_TARGETS.join(", ")})`);
      process.exit(1);
    }
  }
  return null;
}

function filterNextArgv(argv) {
  return argv.filter(
    (a) =>
      a !== "--golden" &&
      a !== "--mozarthitos" &&
      a !== "--espaciozenit" &&
      a !== "--nago" &&
      a !== "--mimundo" &&
      !/^--target=/.test(a),
  );
}

function promptTarget() {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log("");
    console.log("Entorno local (.env):");
    console.log(`  [1] ${TARGETS.golden.label}`);
    console.log(`  [2] ${TARGETS.mozarthitos.label}`);
    console.log(`  [3] ${TARGETS.espaciozenit.label}`);
    console.log(`  [4] ${TARGETS.nago.label}`);
    console.log(`  [5] ${TARGETS.mimundo.label}`);
    rl.question("Elegí 1, 2, 3, 4 o 5 [1]: ", (answer) => {
      rl.close();
      const t = String(answer || "").trim();
      if (t === "" || t === "1") return resolve("golden");
      if (t === "2") return resolve("mozarthitos");
      if (t === "3") return resolve("espaciozenit");
      if (t === "4") return resolve("nago");
      if (t === "5") return resolve("mimundo");
      console.error("Opción inválida (usá 1, 2, 3, 4 o 5).");
      process.exit(1);
    });
  });
}

function printMissingEnvHint(target) {
  console.error("");
  if (target === "golden") {
    console.error("Creación sugerida:");
    console.error("  cp .env.example .env.local.golden");
    console.error("  # rellená valores; si ya tenías .env.local:");
    console.error("  cp .env.local .env.local.golden");
    return;
  }
  console.error("Creación sugerida:");
  console.error(`  cp .env.local.golden .env.local.${target}`);
  console.error(`  # editá NEXT_PUBLIC_APP_URL, Supabase, SITE_BRAND_THEME_SLUG=${target}, etc.`);
}

async function main() {
  const args = process.argv.slice(2);
  let target = parseTarget(args, process.env.GE_DEV_TARGET);

  if (!target) {
    if (!process.stdin.isTTY) {
      console.error(
        `Sin terminal interactiva: definí GE_DEV_TARGET (${VALID_TARGETS.join("|")}) o pasá --target=…`,
      );
      process.exit(1);
    }
    target = await promptTarget();
  }

  const meta = TARGETS[target];
  if (!existsSync(meta.file)) {
    console.error(`No existe ${path.relative(ROOT, meta.file)}`);
    printMissingEnvHint(target);
    process.exit(1);
  }

  copyFileSync(meta.file, OUT_LOCAL);
  if (BRAND_THEME_TARGETS.has(target)) {
    const envText = readFileSync(OUT_LOCAL, "utf8");
    if (!/^SITE_BRAND_THEME_SLUG=/m.test(envText)) {
      appendFileSync(
        OUT_LOCAL,
        `\n# Marca vía tema \`${target}\` sin depender de \`is_active\` (ver .env.example)\nSITE_BRAND_THEME_SLUG=${target}\n`,
      );
    }
  }
  console.log("");
  console.log(`→ Target: ${target}`);
  console.log(`→ Copiado ${path.relative(ROOT, meta.file)} → .env.local`);
  console.log("→ next dev — http://localhost:3000 (Ctrl+C para detener)");
  console.log("");

  const nextCli = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const passthrough = filterNextArgv(args);
  const nextArgs = ["dev"];
  if (!passthrough.includes("--turbo")) nextArgs.push("--webpack");
  nextArgs.push(...passthrough);
  const child = spawn(process.execPath, [nextCli, ...nextArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: envWithDevHttpHeaders({ ...process.env, GE_DEV_TARGET: target }),
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

await main();
