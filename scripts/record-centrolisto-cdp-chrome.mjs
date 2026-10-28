import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function waitForCdp(port, timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* still booting */
    }
    await delay(300);
  }
  throw new Error(`Chrome CDP did not start on ${port}`);
}

export function launchChromeCdp({ userDataDir, profileDirectory, port = 9223 }) {
  const proc = spawn(
    CHROME_BIN,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      `--profile-directory=${profileDirectory}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-sync",
      "--headless=new",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
    { stdio: "ignore" },
  );
  return { proc, cdpUrl: `http://127.0.0.1:${port}`, port };
}

export async function recordCdpPageToWebm(page, { width, height, outFile, tmpDir, run }) {
  const session = await page.context().newCDPSession(page);
  const frames = [];
  session.on("Page.screencastFrame", async (frame) => {
    frames.push(Buffer.from(frame.data, "base64"));
    await session.send("Page.screencastFrameAck", { sessionId: frame.sessionId }).catch(() => {});
  });
  await session.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: height > width,
    screenWidth: width,
    screenHeight: height,
  });
  await session.send("Page.startScreencast", {
    format: "jpeg",
    quality: 72,
    maxWidth: width,
    maxHeight: height,
    everyNthFrame: 1,
  });
  await run();
  await session.send("Page.stopScreencast").catch(() => {});
  await session.detach().catch(() => {});

  if (frames.length < 4) {
    throw new Error(`CDP screencast captured ${frames.length} frames`);
  }
  fs.mkdirSync(tmpDir, { recursive: true });
  frames.forEach((buf, i) => {
    fs.writeFileSync(path.join(tmpDir, `f${String(i).padStart(5, "0")}.jpg`), buf);
  });
  execFileSync("ffmpeg", [
    "-y",
    "-framerate",
    "12",
    "-i",
    path.join(tmpDir, "f%05d.jpg"),
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "1M",
    "-an",
    "-pix_fmt",
    "yuv420p",
    outFile,
  ]);
}
