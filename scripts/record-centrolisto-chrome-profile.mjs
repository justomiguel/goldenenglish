import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const AUTH_ENTRIES = [
  "Cookies",
  "Cookies-journal",
  "Network",
  "Local Storage",
  "Session Storage",
  "Preferences",
];

export function chromeUserDataDir() {
  return path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
}

export function prepareChromeProfileCopy(profileName = "Profile 3") {
  const srcRoot = chromeUserDataDir();
  const srcProfile = path.join(srcRoot, profileName);
  if (!existsSync(srcProfile)) {
    throw new Error(`Chrome profile missing: ${profileName}`);
  }
  const destRoot = path.join(os.tmpdir(), "centrolisto-chrome-rec");
  rmSync(destRoot, { recursive: true, force: true });
  mkdirSync(destRoot, { recursive: true });
  const localState = path.join(srcRoot, "Local State");
  if (existsSync(localState)) cpSync(localState, path.join(destRoot, "Local State"));
  const destProfile = path.join(destRoot, profileName);
  mkdirSync(destProfile, { recursive: true });
  for (const name of AUTH_ENTRIES) {
    const from = path.join(srcProfile, name);
    if (!existsSync(from)) continue;
    cpSync(from, path.join(destProfile, name), { recursive: true });
  }
  return { userDataDir: destRoot, profileDirectory: profileName };
}
