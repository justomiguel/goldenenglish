import localFont from "next/font/local";
import { allura } from "@/components/atoms/fonts/catalog/allura";
import { baloo2 } from "@/components/atoms/fonts/catalog/baloo2";
import { bebasNeue } from "@/components/atoms/fonts/catalog/bebasNeue";
import { caveat } from "@/components/atoms/fonts/catalog/caveat";
import { cormorantGaramond } from "@/components/atoms/fonts/catalog/cormorantGaramond";
import { dmSans } from "@/components/atoms/fonts/catalog/dmSans";
import { fraunces } from "@/components/atoms/fonts/catalog/fraunces";
import { jetbrainsMono } from "@/components/atoms/fonts/catalog/jetbrainsMono";
import { jost } from "@/components/atoms/fonts/catalog/jost";
import { nunito } from "@/components/atoms/fonts/catalog/nunito";
import { oswald } from "@/components/atoms/fonts/catalog/oswald";
import { outfit } from "@/components/atoms/fonts/catalog/outfit";
import { pacifico } from "@/components/atoms/fonts/catalog/pacifico";
import { playfairDisplay } from "@/components/atoms/fonts/catalog/playfairDisplay";
import { plusJakartaSans } from "@/components/atoms/fonts/catalog/plusJakartaSans";

// Google Fonts CSS sometimes has no file extension. Local files keep the build stable.

const fastBlaze = localFont({
  src: "../../../../public/fonts/FAST BLAZE.otf",
  variable: "--font-catalog-espaciozenit-fast-blaze",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});

const rustedVibe = localFont({
  src: "../../../../public/fonts/Rusted Vibe.otf",
  variable: "--font-catalog-espaciozenit-rusted-vibe",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});

const ballet = localFont({
  src: "../../../../public/fonts/Ballet.otf",
  variable: "--font-catalog-espaciozenit-ballet",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});

export const CATALOG_FONTS = {
  "dm-sans": dmSans,
  fraunces,
  oswald,
  outfit,
  "cormorant-garamond": cormorantGaramond,
  jost,
  nunito,
  caveat,
  "baloo-2": baloo2,
  "bebas-neue": bebasNeue,
  pacifico,
  "plus-jakarta-sans": plusJakartaSans,
  "jetbrains-mono": jetbrainsMono,
  "playfair-display": playfairDisplay,
  allura,
  "espaciozenit-fast-blaze": fastBlaze,
  "espaciozenit-rusted-vibe": rustedVibe,
  "espaciozenit-ballet": ballet,
};
