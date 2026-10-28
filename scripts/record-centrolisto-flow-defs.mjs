const PORT = process.env.PORT || "3000";

export function tenantOrigin(slug) {
  return `http://${slug}.localhost:${PORT}`;
}

export const SURFACES = [
  { key: "desktop", width: 960, height: 540 },
  { key: "mobile", width: 390, height: 690 },
];

export const FLOWS = [
  {
    index: 0,
    name: "sunday-night",
    needsAuth: false,
    steps: [
      { url: `${tenantOrigin("nago")}/es`, dwellMs: 1800, scrollY: 420 },
      { url: `${tenantOrigin("liora")}/es`, dwellMs: 1600, scrollY: 280 },
      { url: `${tenantOrigin("golden")}/es/register`, dwellMs: 2200, scrollY: 200 },
    ],
  },
  {
    index: 1,
    name: "tuesday-class",
    needsAuth: true,
    steps: [
      { url: `${tenantOrigin("espaciozenit")}/es/dashboard/admin/academic`, dwellMs: 3200, scrollY: 240 },
    ],
  },
  {
    index: 2,
    name: "fifth-day",
    needsAuth: true,
    steps: [
      { url: `${tenantOrigin("golden")}/es/dashboard/admin`, dwellMs: 2000, scrollY: 180 },
      { url: `${tenantOrigin("golden")}/es/dashboard/admin/finance`, dwellMs: 2600, scrollY: 240 },
    ],
  },
  {
    index: 3,
    name: "friday-evening",
    needsAuth: false,
    steps: [
      { url: `${tenantOrigin("espaciozenit")}/es`, dwellMs: 1600, scrollY: 360 },
      { url: `${tenantOrigin("nago")}/es`, dwellMs: 1600, scrollY: 280 },
      { url: `${tenantOrigin("golden")}/es/register`, dwellMs: 2000, scrollY: 160 },
    ],
  },
];
