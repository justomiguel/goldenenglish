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
        /**
         * Production server, not `next dev`: dev compiled routes on demand (~17s on first
         * hit) which timed out `auth.setup.ts` and aborted navigations with ECONNRESET.
         * `run-e2e-precommit.mjs` builds `.next-e2e` before Playwright starts.
         */
        webServer: {
          command: `NODE_OPTIONS='--max-http-header-size=65536' npx next start -H 127.0.0.1 -p ${webServerPort}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            GE_DEV_TARGET: "e2e",
            EMAIL_PROVIDER: "recording",
            RESEND_API_KEY: "",
            RESEND_FROM_EMAIL: "",
          },
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
      name: "chromium-parent-tours",
      dependencies: ["setup"],
      testMatch: /parent-tours\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.parentStorageState,
      },
    },
    {
      name: "chromium-critical-auth",
      dependencies: ["setup"],
      testMatch: /critical-auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-critical-teacher-auth",
      dependencies: ["setup"],
      testMatch: /critical-teacher-auth\.spec\.ts/,
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
      name: "chromium-critical-payment-reject",
      dependencies: ["setup"],
      testMatch: /critical-payment-reject\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-parent-ward-email",
      dependencies: ["setup"],
      testMatch: /critical-parent-ward-email\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-create-cohort",
      dependencies: ["setup"],
      testMatch: /critical-create-cohort\.spec\.ts/,
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
      name: "chromium-critical-section-unenroll",
      dependencies: ["setup"],
      testMatch: /critical-section-unenroll\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-attendance",
      dependencies: ["setup"],
      testMatch: /critical-attendance\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    /**
     * No `setup` dependency and no storageState on purpose: the whole point is what an
     * unauthenticated caller can reach, so borrowing a session would defeat the test.
     */
    {
      name: "chromium-critical-section-enrollment-link-privileges",
      testMatch: /critical-section-enrollment-link-privileges\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-section-enrollment-link",
      dependencies: ["setup"],
      testMatch: /section-enrollment-link\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    /** Unauthenticated by design too: it measures what the anon key alone can reach. */
    {
      name: "chromium-critical-anon-privilege-hardening",
      testMatch: /critical-anon-privilege-hardening\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-critical-student-care",
      dependencies: ["setup"],
      testMatch: /critical-student-care\.spec\.ts/,
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
    {
      name: "chromium-critical-event-attendee-remove",
      dependencies: ["setup"],
      testMatch: /critical-event-attendee-remove\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-record-payment",
      dependencies: ["setup"],
      testMatch: /critical-record-payment\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-scholarship",
      dependencies: ["setup"],
      testMatch: /critical-scholarship\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: paths.storageState,
      },
    },
    {
      name: "chromium-critical-messaging",
      dependencies: ["setup"],
      testMatch: /critical-messaging\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    /**
     * Late among student-touching projects. Uses a throwaway user created in-spec
     * (never mutates e2e-student@example.test / student storage).
     */
    {
      name: "chromium-critical-forgot-password",
      dependencies: ["setup"],
      testMatch: /critical-forgot-password\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
