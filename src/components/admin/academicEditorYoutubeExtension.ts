import { mergeAttributes } from "@tiptap/core";
import Youtube, { getEmbedUrlFromYoutubeUrl, isValidYoutubeUrl } from "@tiptap/extension-youtube";

function attrsFromIframeSrc(element: HTMLElement): false | { src: string } {
  const src = element.getAttribute("src");
  if (!src || !isValidYoutubeUrl(src)) return false;
  return { src };
}

/**
 * TipTap default YouTube parse only matches `div[data-youtube-video] iframe`.
 * We also accept bare embed iframes (e.g. after older sanitizers) and raise priority over Link.
 * `renderHTML` / `getEmbedUrlFromYoutubeUrl` call `url.match` — guard null/invalid `src` so `setContent` never throws.
 */
export const AcademicYoutube = Youtube.extend({
  priority: 1100,
  parseHTML() {
    return [
      {
        tag: "div[data-youtube-video] iframe",
        getAttrs: (element: HTMLElement) => attrsFromIframeSrc(element),
      },
      {
        tag: 'iframe[src*="youtube-nocookie.com/embed"]',
        getAttrs: (element: HTMLElement) => attrsFromIframeSrc(element),
      },
      {
        tag: 'iframe[src*="youtube.com/embed"]',
        getAttrs: (element: HTMLElement) => attrsFromIframeSrc(element),
      },
      {
        tag: 'iframe[src*="m.youtube.com/embed"]',
        getAttrs: (element: HTMLElement) => attrsFromIframeSrc(element),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const raw = HTMLAttributes.src;
    if (typeof raw !== "string" || !isValidYoutubeUrl(raw)) {
      return [
        "div",
        { "data-youtube-video": "" },
        [
          "iframe",
          mergeAttributes(this.options.HTMLAttributes, {
            width: this.options.width,
            height: this.options.height,
            src: "about:blank",
            frameborder: "0",
          }),
        ],
      ];
    }
    const embedUrl = getEmbedUrlFromYoutubeUrl({
      url: raw,
      allowFullscreen: this.options.allowFullscreen,
      autoplay: this.options.autoplay,
      ccLanguage: this.options.ccLanguage,
      ccLoadPolicy: this.options.ccLoadPolicy,
      controls: this.options.controls,
      disableKBcontrols: this.options.disableKBcontrols,
      enableIFrameApi: this.options.enableIFrameApi,
      endTime: this.options.endTime,
      interfaceLanguage: this.options.interfaceLanguage,
      ivLoadPolicy: this.options.ivLoadPolicy,
      loop: this.options.loop,
      modestBranding: this.options.modestBranding,
      nocookie: this.options.nocookie,
      origin: this.options.origin,
      playlist: this.options.playlist,
      progressBarColor: this.options.progressBarColor,
      startAt: HTMLAttributes.start || 0,
      rel: this.options.rel,
    });
    const attrs = { ...HTMLAttributes, src: embedUrl ?? "about:blank" };
    return [
      "div",
      { "data-youtube-video": "" },
      [
        "iframe",
        mergeAttributes(
          this.options.HTMLAttributes,
          {
            width: this.options.width,
            height: this.options.height,
            allowfullscreen: this.options.allowFullscreen,
            autoplay: this.options.autoplay,
            ccLanguage: this.options.ccLanguage,
            ccLoadPolicy: this.options.ccLoadPolicy,
            disableKBcontrols: this.options.disableKBcontrols,
            enableIFrameApi: this.options.enableIFrameApi,
            endTime: this.options.endTime,
            interfaceLanguage: this.options.interfaceLanguage,
            ivLoadPolicy: this.options.ivLoadPolicy,
            loop: this.options.loop,
            modestBranding: this.options.modestBranding,
            origin: this.options.origin,
            playlist: this.options.playlist,
            progressBarColor: this.options.progressBarColor,
            rel: this.options.rel,
          },
          attrs,
        ),
      ],
    ];
  },
}).configure({ controls: true, nocookie: true, addPasteHandler: true });
