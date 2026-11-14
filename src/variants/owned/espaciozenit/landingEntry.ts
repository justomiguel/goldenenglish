export const espaciozenitLandingEntry = {
  owner: "espaciozenit",
  load: () =>
    import("@/variants/owned/espaciozenit/pieces/LandingMainSectionsEspacioZenit").then(
      (mod) => mod.LandingMainSectionsEspacioZenit,
    ),
};
