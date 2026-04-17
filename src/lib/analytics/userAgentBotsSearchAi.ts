import type { BotMatcher } from "./userAgentBotTypes";

const GOOGLE_DOC =
  "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers";
const BING_DOC = "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0";

/**
 * Search engines + AI assistant crawlers. Order matters: more specific tokens
 * (e.g. `Googlebot-Image`) before broader ones (`Googlebot`).
 */
export const SEARCH_AI_BOTS: BotMatcher[] = [
  { token: "Googlebot-Image", label: "Googlebot Image", vendor: "Google", vendorUrl: GOOGLE_DOC, category: "search" },
  { token: "Googlebot-News", label: "Googlebot News", vendor: "Google", vendorUrl: GOOGLE_DOC, category: "search" },
  { token: "Googlebot-Video", label: "Googlebot Video", vendor: "Google", vendorUrl: GOOGLE_DOC, category: "search" },
  {
    token: "Googlebot",
    label: "Googlebot",
    vendor: "Google",
    vendorUrl: "https://developers.google.com/search/docs/crawling-indexing/googlebot",
    category: "search",
  },
  { token: "AdsBot-Google", label: "AdsBot Google", vendor: "Google", vendorUrl: GOOGLE_DOC, category: "search" },
  {
    token: "Mediapartners-Google",
    label: "AdSense (Mediapartners)",
    vendor: "Google",
    vendorUrl: GOOGLE_DOC,
    category: "search",
  },
  { token: "FeedFetcher-Google", label: "Google FeedFetcher", vendor: "Google", vendorUrl: GOOGLE_DOC, category: "feed" },
  {
    token: "Google-InspectionTool",
    label: "Google Inspection Tool",
    vendor: "Google",
    vendorUrl: GOOGLE_DOC,
    category: "search",
  },
  { token: "Google-Read-Aloud", label: "Google Read Aloud", vendor: "Google", vendorUrl: GOOGLE_DOC, category: "generic" },

  { token: "bingbot", label: "Bingbot", vendor: "Microsoft", vendorUrl: BING_DOC, category: "search" },
  { token: "BingPreview", label: "Bing Preview", vendor: "Microsoft", vendorUrl: BING_DOC, category: "preview" },
  { token: "msnbot", label: "MSN Bot", vendor: "Microsoft", vendorUrl: BING_DOC, category: "search" },

  {
    token: "DuckDuckBot",
    label: "DuckDuckGo",
    vendor: "DuckDuckGo",
    vendorUrl: "https://duckduckgo.com/duckduckbot",
    category: "search",
  },
  {
    token: "YandexBot",
    label: "Yandex",
    vendor: "Yandex",
    vendorUrl: "https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html",
    category: "search",
  },
  {
    token: "Baiduspider",
    label: "Baidu",
    vendor: "Baidu",
    vendorUrl: "https://help.baidu.com/question?prod_id=99&class=476&id=3001",
    category: "search",
  },
  {
    token: "Applebot",
    label: "Applebot",
    vendor: "Apple",
    vendorUrl: "https://support.apple.com/en-us/HT204683",
    category: "search",
  },
  {
    token: "PetalBot",
    label: "PetalBot (Huawei)",
    vendor: "Huawei",
    vendorUrl: "https://aspiegel.com/petalbot",
    category: "search",
  },

  { token: "GPTBot", label: "GPTBot", vendor: "OpenAI", vendorUrl: "https://platform.openai.com/docs/gptbot", category: "ai" },
  {
    token: "ChatGPT-User",
    label: "ChatGPT (browse)",
    vendor: "OpenAI",
    vendorUrl: "https://platform.openai.com/docs/plugins/bot",
    category: "ai",
  },
  {
    token: "OAI-SearchBot",
    label: "OpenAI SearchBot",
    vendor: "OpenAI",
    vendorUrl: "https://platform.openai.com/docs/bots",
    category: "ai",
  },
  {
    token: "anthropic-ai",
    label: "Anthropic AI",
    vendor: "Anthropic",
    vendorUrl: "https://www.anthropic.com",
    category: "ai",
  },
  {
    token: "ClaudeBot",
    label: "ClaudeBot",
    vendor: "Anthropic",
    vendorUrl: "https://support.anthropic.com/en/articles/8896518",
    category: "ai",
  },
  {
    token: "Claude-Web",
    label: "Claude (web)",
    vendor: "Anthropic",
    vendorUrl: "https://support.anthropic.com/en/articles/8896518",
    category: "ai",
  },
  {
    token: "PerplexityBot",
    label: "Perplexity",
    vendor: "Perplexity",
    vendorUrl: "https://docs.perplexity.ai/guides/bots",
    category: "ai",
  },
  {
    token: "CCBot",
    label: "Common Crawl",
    vendor: "Common Crawl",
    vendorUrl: "https://commoncrawl.org/ccbot",
    category: "ai",
  },
  {
    token: "Bytespider",
    label: "Bytespider",
    vendor: "ByteDance",
    vendorUrl: "https://www.bytespider.cn",
    category: "ai",
  },
];
