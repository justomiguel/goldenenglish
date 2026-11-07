import { CAPOEIRA_ME_CHAMA_2022_VIDEOS } from "@/lib/landing/nagoGalleryCapoeiraVideos";
import { nagoGalleryPublicUrl } from "@/lib/landing/nagoGalleryImages";

export const NAGO_GALLERY_EVENT_IDS = [
  "conexion-internacional-2025",
  "capoeira-me-chama-2022",
] as const;

export type NagoGalleryEventId = (typeof NAGO_GALLERY_EVENT_IDS)[number];

export type NagoGalleryFilterId = "all" | NagoGalleryEventId;

export const NAGO_GALLERY_FILTER_IDS = ["all", ...NAGO_GALLERY_EVENT_IDS] as const;

export const NAGO_GALLERY_EVENT_COPY: Record<NagoGalleryEventId, string> = {
  "conexion-internacional-2025": "events.conexionInternacional2025",
  "capoeira-me-chama-2022": "events.capoeiraMeChama2022",
};

type SizeRow = readonly [string, number, number];

const CONEXION_INTERNACIONAL_2025: readonly SizeRow[] = [
  ["01.jpg", 1600, 737],
  ["02.jpg", 1200, 1600],
  ["03.jpg", 1600, 737],
  ["04.jpg", 1600, 737],
  ["05.jpg", 1200, 1600],
  ["06.jpg", 1600, 900],
  ["07.jpg", 1600, 1200],
  ["08.jpg", 1600, 1200],
  ["09.jpg", 1200, 1600],
  ["10.jpg", 1600, 1200],
  ["11.jpg", 1600, 737],
  ["12.jpg", 1600, 1200],
  ["13.jpg", 1200, 1600],
  ["14.jpg", 1200, 1600],
  ["15.jpg", 1600, 1200],
  ["16.jpg", 1200, 1600],
  ["17.jpg", 1200, 1600],
  ["18.jpg", 1600, 1200],
  ["19.jpg", 1600, 1200],
  ["20.jpg", 1600, 1200],
  ["21.jpg", 1600, 1200],
  ["22.jpg", 1200, 1600],
  ["23.jpg", 1600, 1200],
  ["24.jpg", 1600, 1200],
  ["25.jpg", 1200, 1600],
  ["26.jpg", 1600, 1200],
  ["27.jpg", 1600, 1200],
  ["28.jpg", 1600, 1200],
  ["29.jpg", 1600, 1200],
  ["30.jpg", 1600, 1200],
  ["31.jpg", 1600, 1200],
  ["32.jpg", 1600, 1200],
  ["33.jpg", 1600, 1200],
  ["34.jpg", 1600, 1200],
  ["35.jpg", 1200, 1600],
  ["36.jpg", 1200, 1600],
  ["37.jpg", 1200, 1600],
  ["38.jpg", 1600, 1200],
  ["39.jpg", 1200, 1600],
  ["40.jpg", 1200, 1600],
  ["41.jpg", 1200, 1600],
];

const CAPOEIRA_ME_CHAMA_2022: readonly SizeRow[] = [
  ["01.jpg", 1600, 1200],
  ["02.jpg", 1600, 1200],
  ["03.jpg", 1600, 1200],
  ["04.jpg", 1600, 1200],
  ["05.jpg", 1600, 1200],
  ["06.jpg", 1600, 1200],
  ["07.jpg", 1600, 1200],
  ["08.jpg", 1200, 1600],
  ["09.jpg", 1200, 1600],
  ["10.jpg", 1200, 1600],
  ["11.jpg", 1600, 900],
  ["12.jpg", 1600, 1200],
  ["13.jpg", 1600, 1195],
  ["14.jpg", 1600, 900],
  ["15.jpg", 1200, 1600],
  ["16.jpg", 1200, 1600],
  ["17.jpg", 1600, 900],
  ["18.jpg", 1600, 900],
  ["19.jpg", 900, 1600],
  ["20.jpg", 1600, 900],
  ["21.jpg", 1600, 1195],
  ["22.jpg", 1600, 900],
  ["23.jpg", 1600, 900],
  ["24.jpg", 1600, 900],
  ["25.jpg", 1600, 1200],
  ["26.jpg", 1600, 900],
  ["27.jpg", 1600, 1200],
  ["28.jpg", 1600, 900],
  ["29.jpg", 1600, 1200],
  ["30.jpg", 1600, 1200],
  ["31.jpg", 1600, 900],
  ["32.jpg", 1600, 1200],
  ["33.jpg", 1600, 1200],
  ["34.jpg", 1600, 1200],
  ["35.jpg", 1600, 1200],
  ["36.jpg", 1600, 1200],
  ["37.jpg", 1600, 1200],
  ["38.jpg", 1600, 1200],
  ["39.jpg", 1600, 1200],
  ["40.jpg", 1600, 1200],
  ["41.jpg", 1600, 1200],
  ["42.jpg", 1600, 1200],
  ["43.jpg", 1200, 1600],
  ["44.jpg", 1600, 900],
  ["45.jpg", 1600, 900],
  ["46.jpg", 1600, 1200],
  ["47.jpg", 1600, 1195],
  ["48.jpg", 1600, 900],
  ["49.jpg", 1600, 1200],
  ["50.jpg", 1600, 1200],
  ["51.jpg", 1600, 1200],
  ["52.jpg", 1600, 1200],
];

export type NagoGalleryImage = {
  eventId: NagoGalleryEventId;
  kind: "image";
  src: string;
  width: number;
  height: number;
};

export type NagoGalleryVideo = {
  eventId: NagoGalleryEventId;
  kind: "video";
  src: string;
  poster: string;
  width: number;
  height: number;
};

export type NagoGalleryItem = NagoGalleryImage | NagoGalleryVideo;

function imageRows(eventId: NagoGalleryEventId, rows: readonly SizeRow[]): NagoGalleryImage[] {
  return rows.map(([file, width, height]) => ({
    eventId,
    kind: "image",
    src: nagoGalleryPublicUrl(`${eventId}/${file}`),
    width,
    height,
  }));
}

type VideoRow = readonly [string, string, number, number];

function videoRows(eventId: NagoGalleryEventId, rows: readonly VideoRow[]): NagoGalleryVideo[] {
  return rows.map(([file, poster, width, height]) => ({
    eventId,
    kind: "video",
    src: nagoGalleryPublicUrl(`${eventId}/${file}`),
    poster: nagoGalleryPublicUrl(`${eventId}/${poster}`),
    width,
    height,
  }));
}

export const NAGO_GALLERY_ITEMS: readonly NagoGalleryItem[] = [
  ...imageRows("conexion-internacional-2025", CONEXION_INTERNACIONAL_2025),
  ...imageRows("capoeira-me-chama-2022", CAPOEIRA_ME_CHAMA_2022),
  ...videoRows("capoeira-me-chama-2022", CAPOEIRA_ME_CHAMA_2022_VIDEOS),
];

export function filterNagoGalleryItems<T extends { eventId: string }>(
  items: readonly T[],
  filter: "all" | string,
): readonly T[] {
  if (filter === "all") return items;
  return items.filter((item) => item.eventId === filter);
}

export function nagoGalleryItemsFor(filter: NagoGalleryFilterId): readonly NagoGalleryItem[] {
  return filterNagoGalleryItems(NAGO_GALLERY_ITEMS, filter);
}

export const NAGO_GALLERY_PREVIEW_COUNT = 3;

export function nagoGalleryImagesFor(eventId: NagoGalleryEventId): readonly NagoGalleryImage[] {
  return nagoGalleryItemsFor(eventId).filter((item): item is NagoGalleryImage => item.kind === "image");
}

export function nagoGalleryVideosFor(eventId: NagoGalleryEventId): readonly NagoGalleryVideo[] {
  return nagoGalleryItemsFor(eventId).filter((item): item is NagoGalleryVideo => item.kind === "video");
}

export function nagoGalleryPreviewItems(eventId: NagoGalleryEventId): readonly NagoGalleryImage[] {
  return nagoGalleryImagesFor(eventId).slice(0, NAGO_GALLERY_PREVIEW_COUNT);
}

export function nagoGalleryVideoPreviewItems(eventId: NagoGalleryEventId): readonly NagoGalleryVideo[] {
  return nagoGalleryVideosFor(eventId).slice(0, NAGO_GALLERY_PREVIEW_COUNT);
}
