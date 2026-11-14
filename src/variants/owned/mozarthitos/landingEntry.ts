export const mozarthitosLandingEntry = {
  owner: "mozarthitos",
  load: () =>
    import("@/variants/owned/mozarthitos/pieces/LandingMainSectionsMozarthitos").then((mod) => mod.LandingMainSectionsMozarthitos),
};
