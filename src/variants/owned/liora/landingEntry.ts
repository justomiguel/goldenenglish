export const lioraLandingEntry = {
  owner: "liora",
  load: () =>
    import("@/variants/owned/liora/pieces/LandingMainSectionsLiora").then((mod) => mod.LandingMainSectionsLiora),
};
