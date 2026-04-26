/** Mirrors @tiptap/extension-link default `shouldAutoLink`, minus YouTube (embed handled by the YouTube node). */
export function tiptapAcademicLinkShouldAutoLink(url: string): boolean {
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const hasMaybeProtocol = /^[a-z][a-z0-9+.-]*:/i.test(url);
  if (hasProtocol || (hasMaybeProtocol && !url.includes("@"))) {
    return true;
  }
  const urlWithoutUserinfo = url.includes("@") ? (url.split("@").pop() ?? url) : url;
  const hostname = urlWithoutUserinfo.split(/[/?#:]/)[0] ?? "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }
  if (!/\./.test(hostname)) {
    return false;
  }
  return true;
}
