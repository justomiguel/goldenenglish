export const matissLandingEntry = {
  owner: "matiss",
  load: () =>
    import("@/variants/owned/matiss/pieces/LandingMainSectionsMatiss").then((mod) => mod.LandingMainSectionsMatiss),
};
