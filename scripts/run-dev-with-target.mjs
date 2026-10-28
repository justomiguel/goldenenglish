#!/usr/bin/env node
/**
 * Levanta `next dev` con `DEV_TENANT_SLUG` for bare `localhost`.
 * Institute sites resolve from Pulsar `platform_tenants` via `{slug}.localhost`.
 * `TENANTS_CONFIG_JSON` is optional and not required to start.
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

function isSlug(value) {
  return /^[a-z0-9][a-z0-9-]*$/.test(value);
}

function loadKnownTargets() {
  const bySlug = new Map();
  bySlug.set("pulsar", {
    slug: "pulsar",
    label: "pulsar — Centro Listo (localhost / pulsar.localhost)",
  });
  for (const [slug, name] of Object.entries(DEFAULT_LABELS)) {
    if (slug === "pulsar") continue;
    bySlug.set(slug, {
      slug,
      label: `${slug} — ${name} (http://${slug}.localhost:3000)`,
    });
  }
  if (existsSync(ENV_LOCAL)) {
    const parsedEnv = readEnvFile(ENV_LOCAL);
    const raw = (parsedEnv.TENANTS_CONFIG_JSON || process.env.TENANTS_CONFIG_JSON || "").trim();
    if (raw) {
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const row of list) {
            if (!row || typeof row !== "object" || typeof row.slug !== "string") continue;
            const slug = row.slug.trim().toLowerCase();
            if (!isSlug(slug) || bySlug.has(slug)) continue;
            bySlug.set(slug, { slug, label: `${slug} (http://${slug}.localhost:3000)` });
          }
        }
      } catch {
        /* JSON is not the runtime registry */
      }
    }
  }
  return [...bySlug.values()];
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
      if (validSlugs.includes(t) || isSlug(t)) return t;
      console.error(`Valor inválido para --target: ${m[1]}`);
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
    console.log("Instituto local (Pulsar platform_tenants; {slug}.localhost):");
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
  const tenants = loadKnownTargets();
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
  console.log(`→ Bare localhost (DEV_TENANT_SLUG): ${target}`);
  console.log("→ Fuente: Pulsar platform_tenants");
  console.log("→ Centro Listo — http://localhost:3000");
  console.log("→ Institutos — http://<slug>.localhost:3000 (mismo proceso)");
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
