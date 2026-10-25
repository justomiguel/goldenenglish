#!/usr/bin/env node
/**
 * Elige el instituto en local a partir de `TENANTS_CONFIG_JSON` en `.env.local`
 * y levanta `next dev` con `DEV_TENANT_SLUG=<slug>` y `GE_DEV_TARGET=<slug>`,
 * sin copiar ni pisar `.env.local` (mismo contrato que el proyecto único de Vercel).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readEnvFile } from "./migrate-public-assets-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const DEFAULT_LABELS = {
  pulsar: "Pulsar Lab (plataforma y control plane)",
  golden: "Golden English (proyecto principal)",
  mozarthitos: "Mozarthitos",
  espaciozenit: "Espacio Zenit",
  nago: "Capoeira Nago",
  mimundo: "Jardín Materno Infantil Mi Mundo",
  liora: "Liora Studio (ballet)",
};

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

function loadTenantsFromEnvLocal() {
  if (!existsSync(ENV_LOCAL)) {
    console.error("No existe .env.local en la raíz del proyecto.");
    console.error("  Crealo desde .env.example y definí TENANTS_CONFIG_JSON.");
    process.exit(1);
  }
  const parsedEnv = readEnvFile(ENV_LOCAL);
  const raw = (parsedEnv.TENANTS_CONFIG_JSON || process.env.TENANTS_CONFIG_JSON || "").trim();
  if (!raw) {
    console.error("Falta TENANTS_CONFIG_JSON en .env.local.");
    process.exit(1);
  }
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    console.error("TENANTS_CONFIG_JSON en .env.local no es JSON válido.");
    process.exit(1);
  }
  if (!Array.isArray(list) || list.length === 0) {
    console.error("TENANTS_CONFIG_JSON debe ser un array no vacío.");
    process.exit(1);
  }
  const configured = list
    .filter((row) => row && typeof row === "object" && typeof row.slug === "string")
    .map((row) => {
      const slug = row.slug.trim().toLowerCase();
      const hostHint = Array.isArray(row.hosts) && row.hosts[0] ? ` (${row.hosts[0]})` : "";
      const label = DEFAULT_LABELS[slug]
        ? `${slug} — ${DEFAULT_LABELS[slug]}${hostHint}`
        : `${slug}${hostHint}`;
      return {
        slug,
        label,
        supabaseUrl: typeof row.supabaseUrl === "string" ? row.supabaseUrl.trim() : "",
        supabaseAnonKey: typeof row.supabaseAnonKey === "string" ? row.supabaseAnonKey.trim() : "",
        supabaseServiceRoleKey:
          typeof row.supabaseServiceRoleKey === "string" ? row.supabaseServiceRoleKey.trim() : "",
      };
    });
  return [
    {
      slug: "pulsar",
      label: `pulsar — ${DEFAULT_LABELS.pulsar} (pulsarlab.cl)`,
      supabaseUrl: "",
      supabaseAnonKey: "",
      supabaseServiceRoleKey: "",
    },
    ...configured,
  ];
}

function parseTarget(argv, envTarget, validSlugs) {
  const fromEnv = (envTarget || "").trim().toLowerCase();
  if (validSlugs.includes(fromEnv)) return fromEnv;

  for (const a of argv) {
    const asFlag = a.startsWith("--") ? a.slice(2).toLowerCase() : "";
    if (validSlugs.includes(asFlag)) return asFlag;
    const m = /^--target=(.+)$/.exec(a);
    if (m) {
      const t = m[1].trim().toLowerCase();
      if (validSlugs.includes(t)) return t;
      console.error(`Valor inválido para --target: ${m[1]} (usa ${validSlugs.join(", ")})`);
      process.exit(1);
    }
  }
  return null;
}

function filterNextArgv(argv, validSlugs) {
  return argv.filter(
    (a) =>
      !validSlugs.includes(a.startsWith("--") ? a.slice(2).toLowerCase() : "") &&
      !/^--target=/.test(a),
  );
}

function promptTarget(tenants) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const choices = tenants.map((t) => t.slug).join(", ");
    console.log("");
    console.log("Instituto local (desde TENANTS_CONFIG_JSON en .env.local):");
    tenants.forEach((tenant, i) => {
      console.log(`  [${i + 1}] ${tenant.label}`);
    });
    rl.question(`Elegí 1-${tenants.length} [1]: `, (answer) => {
      rl.close();
      const t = String(answer || "").trim();
      if (t === "") return resolve(tenants[0].slug);
      const index = Number.parseInt(t, 10);
      const picked = tenants[index - 1];
      if (picked) return resolve(picked.slug);
      if (tenants.some((x) => x.slug === t.toLowerCase())) return resolve(t.toLowerCase());
      console.error(`Opción inválida (usá 1-${tenants.length}: ${choices}).`);
      process.exit(1);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const tenants = loadTenantsFromEnvLocal();
  const validSlugs = tenants.map((t) => t.slug);
  let target = parseTarget(
    args,
    process.env.GE_DEV_TARGET || process.env.DEV_TENANT_SLUG,
    validSlugs,
  );

  if (!target) {
    if (!process.stdin.isTTY) {
      console.error(
        `Sin terminal interactiva: definí GE_DEV_TARGET (${validSlugs.join("|")}) o pasá --target=…`,
      );
      process.exit(1);
    }
    target = await promptTarget(tenants);
  }

  console.log("");
  console.log(`→ Instituto activo (DEV_TENANT_SLUG): ${target}`);
  console.log("→ Fuente: TENANTS_CONFIG_JSON en .env.local (sin copiar archivos)");
  console.log("→ next dev — http://localhost:3000 (Ctrl+C para detener)");
  console.log("");

  const nextCli = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const passthrough = filterNextArgv(args, validSlugs);
  const nextArgs = ["dev"];
  if (!passthrough.includes("--turbo")) nextArgs.push("--webpack");
  nextArgs.push(...passthrough);
  const child = spawn(process.execPath, [nextCli, ...nextArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: envWithDevHttpHeaders({
      ...process.env,
      GE_DEV_TARGET: target,
      DEV_TENANT_SLUG: target,
    }),
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

await main();
