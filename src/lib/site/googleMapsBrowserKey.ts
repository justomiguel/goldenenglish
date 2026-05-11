/** Browser-safe Maps key (restricted by HTTP referrer in Google Cloud). */
export function readGoogleMapsBrowserKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}
