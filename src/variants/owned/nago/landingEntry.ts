export const nagoLandingEntry = {
  owner: "nago",
  load: () =>
    import("@/components/organisms/LandingMainSectionsNago").then((mod) => mod.LandingMainSectionsNago),
};
