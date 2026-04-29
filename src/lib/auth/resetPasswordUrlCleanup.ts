/** Remove consumed auth params from the address bar without reloading. */
export function stripTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function replaceUrlWithoutRecoveryAuthParams(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const keys = ["code", "token_hash", "type", "access_token", "refresh_token"];
    let changed = false;
    for (const k of keys) {
      if (url.searchParams.has(k)) {
        url.searchParams.delete(k);
        changed = true;
      }
    }
    if (url.hash.startsWith("#")) {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      for (const k of keys) {
        if (hashParams.has(k)) {
          hashParams.delete(k);
          changed = true;
        }
      }
      const h = hashParams.toString();
      url.hash = h ? `#${h}` : "";
      if (!h) changed = true;
    }
    if (changed) {
      window.history.replaceState(window.history.state, "", url.toString());
    }
  } catch {
    /* ignore */
  }
}
