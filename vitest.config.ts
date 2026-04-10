import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.tsx"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      /**
       * 100% sobre lib, hooks, proxy, componentes y app (actions, manifest, robots, sitemap).
       * `page.tsx` / `layout.tsx` quedan fuera: son entrypoints RSC con muchas dependencias
       * de Next/Supabase mejor cubiertas por pruebas de integración o E2E.
       */
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "src/proxy.ts",
        "src/components/**/*.{ts,tsx}",
        "src/app/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/test/**",
        "src/**/*.test.*",
        "src/types/**",
        "src/**/*.d.ts",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
      ],
      /**
       * Con `components` + `app` en el include, el 100% global exige E2E/interacción
       * en casi cada organismo; los números reflejan el estado actual del repo (~abr 2026).
       * `src/lib`, `src/hooks` y `src/proxy` siguen al 100% en el reporte.
       */
      /**
       * Líneas y statements al 100% en el ámbito incluido. `functions`/`branches`
       * quedan ~95/96 por conteos V8 de funciones inline (handlers en JSX) y ramas
       * parciales; subirlos más exige hacks o exclusiones poco útiles.
       */
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 94,
        branches: 96,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
