export const nagoLandingEntry = {
  owner: "nago",
  load: () =>
    import("@/variants/owned/nago/pieces/LandingMainSectionsNago").then((mod) => mod.LandingMainSectionsNago),
};
