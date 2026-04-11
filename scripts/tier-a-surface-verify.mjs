/**
 * Tier A (student/parent dashboard pages): every page.tsx must transitively import
 * a module that references SurfaceMountGate (see .cursor/rules/05-pwa-mobile-native.mdc).
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve, normalize, relative } from "node:path";

/** @param {string} srcRoot */
/** @param {string} abs */
function underSrcRoot(srcRoot, abs) {
  const r = relative(srcRoot, abs);
  return r !== "" && !r.startsWith("..");
}

/** @param {string} content */
export function parseLocalImports(content) {
  const out = [];
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (t.startsWith("//")) continue;
    let m = t.match(/^import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/);
    if (m) out.push(m[1]);
    m = t.match(/^export\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/);
    if (m) out.push(m[1]);
  }
  return out;
}

/**
 * @param {string} root
 * @param {string} fromAbs
 * @param {string} spec
 */
export function resolveTsModule(root, fromAbs, spec) {
  const srcRoot = join(root, "src");
  let base;
  if (spec.startsWith("@/")) {
    base = join(srcRoot, spec.slice(2));
  } else if (spec.startsWith(".")) {
    base = resolve(dirname(fromAbs), spec);
  } else {
    return null;
  }
  base = normalize(base);

  const tryFile = (p) => {
    if (!underSrcRoot(srcRoot, p)) return null;
    if (existsSync(p) && statSync(p).isFile() && /\.(tsx?)$/.test(p)) return p;
    return null;
  };

  const direct = tryFile(base);
  if (direct) return direct;

  for (const ext of [".tsx", ".ts"]) {
    const p = base + ext;
    const f = tryFile(p);
    if (f) return f;
  }

  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const idx of ["index.tsx", "index.ts"]) {
      const p = join(base, idx);
      const f = tryFile(p);
      if (f) return f;
    }
  }

  return null;
}

/**
 * @param {string} root
 * @param {string} startAbs absolute path to page.tsx
 */
export function reachesSurfaceMountGate(root, startAbs) {
  const srcRoot = join(root, "src");
  const queue = [normalize(startAbs)];
  const visited = new Set();

  while (queue.length) {
    const abs = /** @type {string} */ (queue.shift());
    if (!abs || visited.has(abs)) continue;
    visited.add(abs);
    if (!underSrcRoot(srcRoot, abs) || !/\.(tsx?)$/.test(abs)) continue;

    let content;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    if (content.includes("SurfaceMountGate")) return true;

    for (const spec of parseLocalImports(content)) {
      const next = resolveTsModule(root, abs, spec);
      if (next && !visited.has(next)) queue.push(next);
    }
  }

  return false;
}

/**
 * @param {string} root
 * @param {() => string[]} listRelPaths e.g. git ls-files
 */
export function findTierAStudentParentPages(listRelPaths) {
  return listRelPaths.filter(
    (f) =>
      f.endsWith("/page.tsx") &&
      /src\/app\/\[locale\]\/dashboard\/(student|parent)\//.test(f),
  );
}
