import type { AdminWeeklyDigest, DigestColors } from "@/lib/admin-digest/adminWeeklyDigestTypes";

const FALLBACK: DigestColors = {
  primary: "#103A5C",
  primaryLight: "#2A5B84",
  primaryDark: "#0A253D",
  foreground: "#FFFFFF",
  background: "#FAF9F6",
};

function hex(value: string, fallback: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

export function safeDigestColors(colors: DigestColors): DigestColors {
  return {
    primary: hex(colors.primary, FALLBACK.primary),
    primaryLight: hex(colors.primaryLight, FALLBACK.primaryLight),
    primaryDark: hex(colors.primaryDark, FALLBACK.primaryDark),
    foreground: hex(colors.foreground, FALLBACK.foreground),
    background: hex(colors.background, FALLBACK.background),
  };
}

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export function digestChartSvgs(digest: AdminWeeklyDigest, rawColors: DigestColors): {
  cobro: string;
  parents: string;
  weekday: string;
  aula: string;
} {
  const c = safeDigestColors(rawColors);
  return {
    cobro: cobroDonut(ratio(digest.tuition.paidCount, digest.tuition.invoiceCount), c),
    parents: parentLine(digest.parentPercents, c),
    weekday: weekdayBars(digest.weekdaySessions, c),
    aula: aulaBars(digest, c),
  };
}

function cobroDonut(percent: number, c: DigestColors): string {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = (percent / 100) * circ;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120">
<rect width="120" height="120" fill="${c.background}"/>
<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${c.primaryLight}" stroke-width="14"/>
<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${c.primary}" stroke-width="14" stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}" transform="rotate(-90 60 60)"/>
<text x="60" y="66" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="${c.primaryDark}">${percent}%</text>
</svg>`;
}

function parentLine(percents: [number, number, number, number], c: DigestColors): string {
  const xs = [24, 88, 152, 216];
  const y = (value: number) => 100 - value * 0.7;
  const points = percents.map((value, index) => `${xs[index]},${y(value).toFixed(1)}`).join(" ");
  const dots = percents
    .map(
      (value, index) =>
        `<circle cx="${xs[index]}" cy="${y(value).toFixed(1)}" r="5" fill="${c.primary}"/><text x="${xs[index]}" y="${(y(value) - 10).toFixed(1)}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="${c.primaryDark}">${value}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 240 130">
<rect width="240" height="130" fill="${c.background}"/>
<polyline points="${points}" fill="none" stroke="${c.primary}" stroke-width="3"/>
${dots}
</svg>`;
}

function weekdayBars(counts: number[], c: DigestColors): string {
  const max = Math.max(1, ...counts);
  const bars = counts
    .map((count, index) => {
      const height = Math.round((count / max) * 70);
      const x = 16 + index * 32;
      const y = 96 - height;
      return `<rect x="${x}" y="${y}" width="20" height="${height}" fill="${c.primary}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 248 110">
<rect width="248" height="110" fill="${c.background}"/>
${bars}
</svg>`;
}

function aulaBars(digest: AdminWeeklyDigest, c: DigestColors): string {
  const attendance = ratio(digest.attendanceMarkedSections, digest.attendanceSections);
  const tasks = ratio(digest.tasksIncomplete, digest.tasksDue);
  const bar = (y: number, percent: number) =>
    `<rect x="16" y="${y}" width="200" height="16" rx="4" fill="${c.primaryLight}"/><rect x="16" y="${y}" width="${Math.round(percent * 2)}" height="16" rx="4" fill="${c.primary}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120" viewBox="0 0 240 80">
<rect width="240" height="80" fill="${c.background}"/>
${digest.attendanceSections > 0 ? bar(14, attendance) : ""}
${digest.tasksDue > 0 ? bar(46, tasks) : ""}
</svg>`;
}
