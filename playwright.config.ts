import { defineConfig, devices } from "@playwright/test";
import {
  defaultE2eBaseURL,
  e2eAuthPaths,
  e2eRequireEnabled,
  resolveE2eIsolation,
} from "./e2e/env";

const isolation = resolveE2eIsolation();
const requireGate = e2eRequireEnabled();
const paths = e2eAuthPaths();
const baseURL = isolation.ok
  ? isolation.baseURL
  : (process.env.PLAYWRIGHT_BASE_URL?.trim() || defaultE2eBaseURL());

let webServerPort = 3100;
try {
  const u = new URL(baseURL);
  webServerPort = Number(u.port || "3100") || 3100;
} catch {
  webServerPort = 3100;
}

/**
 * App E2E — isolated stack only.
 * See docs/runbooks/e2e-isolated-harness.md and rule 34-precommit-e2e.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI || requireGate ? 1 : 0,
  timeout: 90_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  ...(requireGate
    ? {
        webServer: {
          command: `NODE_OPTIONS='--max-http-header-size=65536' npx next dev --webpack -H 127.0.0.1 -p ${webServerPort}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }
    : {}),
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium-admin-tours",
      dependencies: ["setup"],
      testMatch: /admin-tours\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-auth",
      dependencies: ["setup"],
      testMatch: /critical-auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-critical-academic",
      dependencies: ["setup"],
      testMatch: /critical-academic\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-registration",
      dependencies: ["setup"],
      testMatch: /critical-registration\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-critical-payments",
      dependencies: ["setup"],
      testMatch: /critical-payments\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-create-user",
      dependencies: ["setup"],
      testMatch: /critical-create-user\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-events",
      dependencies: ["setup"],
      testMatch: /critical-events\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-critical-create-section",
      dependencies: ["setup"],
      testMatch: /critical-create-section\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-users-import",
      dependencies: ["setup"],
      testMatch: /critical-users-import\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-paid-event",
      dependencies: ["setup"],
      testMatch: /critical-paid-event\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-critical-parent-payments",
      dependencies: ["setup"],
      testMatch: /critical-parent-payments\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-section-enroll",
      dependencies: ["setup"],
      testMatch: /critical-section-enroll\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-event-payment-approve",
      dependencies: ["setup"],
      testMatch: /critical-event-payment-approve\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
  ],
});
