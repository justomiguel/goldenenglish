#!/usr/bin/env node
/**
 * Elige entorno local (golden vs mozarthitos), copia el archivo prefijado a `.env.local`
 * y ejecuta `next dev`. Next solo lee `.env.local`; así evitamos deps extra (dotenv-cli).
 *
 * Archivos (gitignored): `.env.local.golden`, `.env.local.mozarthitos`
 * Sin TTY (CI): usa `GE_DEV_TARGET=golden|mozarthitos` o `--target=…`.
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
};
const OUT_LOCAL = path.join(ROOT, ".env.local");

function parseTarget(argv, envTarget) {
  const fromEnv = (envTarget || "").trim().toLowerCase();
  if (fromEnv === "golden" || fromEnv === "mozarthitos") return fromEnv;

  for (const a of argv) {
    if (a === "--golden") return "golden";
    if (a === "--mozarthitos") return "mozarthitos";
    const m = /^--target=(.+)$/.exec(a);
    if (m) {
      const t = m[1].trim().toLowerCase();
      if (t === "golden" || t === "mozarthitos") return t;
      console.error(`Valor inválido para --target: ${m[1]} (usa golden o mozarthitos)`);
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
    rl.question("Elegí 1 o 2 [1]: ", (answer) => {
      rl.close();
      const t = String(answer || "").trim();
      if (t === "" || t === "1") return resolve("golden");
      if (t === "2") return resolve("mozarthitos");
      console.error("Opción inválida (usá 1 o 2).");
      process.exit(1);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let target = parseTarget(args, process.env.GE_DEV_TARGET);

  if (!target) {
    if (!process.stdin.isTTY) {
      console.error(
        "Sin terminal interactiva: definí GE_DEV_TARGET=golden o GE_DEV_TARGET=mozarthitos, o pasá --target=…",
      );
      process.exit(1);
    }
    target = await promptTarget();
  }

  const meta = TARGETS[target];
  if (!existsSync(meta.file)) {
    console.error(`No existe ${path.relative(ROOT, meta.file)}`);
    console.error("");
    if (target === "golden") {
      console.error("Creación sugerida:");
      console.error("  cp .env.example .env.local.golden");
      console.error("  # rellená valores; si ya tenías .env.local:");
      console.error("  cp .env.local .env.local.golden");
    } else {
      console.error("Creación sugerida:");
      console.error("  cp .env.local.golden .env.local.mozarthitos");
      console.error("  # editá NEXT_PUBLIC_APP_URL, Supabase, etc. para mozarthitos");
    }
    process.exit(1);
  }

  copyFileSync(meta.file, OUT_LOCAL);
  if (target === "mozarthitos") {
    const envText = readFileSync(OUT_LOCAL, "utf8");
    if (!/^SITE_BRAND_THEME_SLUG=/m.test(envText)) {
      appendFileSync(
        OUT_LOCAL,
        "\n# Marca vía tema `mozarthitos` sin depender de `is_active` (ver .env.example)\nSITE_BRAND_THEME_SLUG=mozarthitos\n",
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
    env: { ...process.env, GE_DEV_TARGET: target },
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

await main();
