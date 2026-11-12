import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

function aliasFile(specifier) {
  const base = path.join(root, "src", specifier.slice(2));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? `${base}.ts`;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return nextResolve(pathToFileURL(aliasFile(specifier)).href, context);
  }
  return nextResolve(specifier, context);
}
