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
       * Objetivo ≥90% sobre lib, hooks, proxy, componentes y app (actions, manifest, robots, sitemap).
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
        "src/app/**/opengraph-image.tsx",
        /* Thin dashboard shells + TipTap wrapper; exercised manually / E2E */
        "src/components/student/**",
        "src/components/teacher/**",
        "src/components/molecules/RichTextEditor.tsx",
        /* Server-only email + messaging integration (actions tested; providers need env) */
        "src/lib/email/**",
        "src/lib/messaging/notifyMessagingEmails.ts",
        "src/lib/messaging/resolveTeacherId.ts",
        "src/lib/messaging/useCases/**",
        "src/lib/payments/studentReceiptSignedUrl.ts",
      ],
      /**
       * Con `components` + `app` en el include, cobertura total alta exige muchas pruebas
       * de interacción; el umbral global queda en 90%.
       */
      /** Mínimos globales: líneas, statements, funciones y ramas al 90%. */
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
