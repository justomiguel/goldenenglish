/**
 * @typedef {{ path: string, code: string, slug: string, count: number }} BaselineEntry
 * @typedef {{ path: string, code: string, slug: string, line: number }} HardcodeHit
 */

/**
 * @param {HardcodeHit[]} hits
 * @returns {BaselineEntry[]}
 */
function countHits(hits) {
  /** @type {Map<string, BaselineEntry>} */
  const map = new Map();
  for (const hit of hits) {
    const key = `${hit.path}\0${hit.code}\0${hit.slug}`;
    const current = map.get(key);
    if (current) current.count += 1;
    else map.set(key, { path: hit.path, code: hit.code, slug: hit.slug, count: 1 });
  }
  return [...map.values()].sort(byEntry);
}

/**
 * @param {BaselineEntry} a
 * @param {BaselineEntry} b
 */
function byEntry(a, b) {
  return a.path.localeCompare(b.path) || a.code.localeCompare(b.code) || a.slug.localeCompare(b.slug);
}

/**
 * @param {HardcodeHit[]} hits
 * @param {BaselineEntry[]} baseline
 */
export function compareWithBaseline(hits, baseline) {
  const now = countHits(hits);
  const previous = new Map(baseline.map((entry) => [`${entry.path}\0${entry.code}\0${entry.slug}`, entry]));
  /** @type {BaselineEntry[]} */
  const grown = [];
  /** @type {BaselineEntry[]} */
  const shrunk = [];
  for (const entry of now) {
    const old = previous.get(`${entry.path}\0${entry.code}\0${entry.slug}`);
    if (!old || entry.count > old.count) grown.push(entry);
    else if (entry.count < old.count) shrunk.push({ ...old, count: old.count });
  }
  for (const entry of baseline) {
    const key = `${entry.path}\0${entry.code}\0${entry.slug}`;
    if (!now.some((item) => `${item.path}\0${item.code}\0${item.slug}` === key)) shrunk.push(entry);
  }
  grown.sort(byEntry);
  shrunk.sort(byEntry);
  return { grown, shrunk };
}

/**
 * @param {HardcodeHit[]} hits
 * @param {BaselineEntry[]} baseline
 * @returns {BaselineEntry[]}
 */
export function raisedAgainstCommitted(working, committed) {
  const previous = new Map(committed.map((entry) => [`${entry.path}\0${entry.code}\0${entry.slug}`, entry.count]));
  /** @type {BaselineEntry[]} */
  const raised = [];
  for (const entry of working) {
    const key = `${entry.path}\0${entry.code}\0${entry.slug}`;
    const old = previous.get(key);
    if (old === undefined || entry.count > old) raised.push(entry);
  }
  return raised.sort(byEntry);
}

/**
 * @param {HardcodeHit[]} hits
 * @param {BaselineEntry[]} baseline
 * @returns {BaselineEntry[]}
 */
export function lowerBaseline(hits, baseline) {
  const now = new Map(countHits(hits).map((entry) => [`${entry.path}\0${entry.code}\0${entry.slug}`, entry.count]));
  /** @type {BaselineEntry[]} */
  const next = [];
  for (const entry of baseline) {
    const key = `${entry.path}\0${entry.code}\0${entry.slug}`;
    const seen = now.get(key) ?? 0;
    const count = Math.min(entry.count, seen);
    if (count > 0) next.push({ path: entry.path, code: entry.code, slug: entry.slug, count });
  }
  return next.sort(byEntry);
}
