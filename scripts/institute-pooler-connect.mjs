/** Connection checks for the IPv4 session pooler. Used only by the apply script. */

export function createInstitutePoolerDeps({ lookup, Client, cachePath, readPoolerHostCache, writePoolerHostCache }) {
  return {
    hasIpv4: async (hostname) => {
      try {
        await lookup(hostname, { family: 4 });
        return true;
      } catch {
        return false;
      }
    },
    canConnect: async (url) => {
      const client = new Client({ connectionString: url, connectionTimeoutMillis: 8000 });
      try {
        await client.connect();
        await client.query("select 1");
        return true;
      } catch {
        return false;
      } finally {
        await client.end().catch(() => {});
      }
    },
    readCache: (ref) => readPoolerHostCache(cachePath, ref),
    writeCache: (ref, host) => writePoolerHostCache(cachePath, ref, host),
  };
}
