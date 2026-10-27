import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Real sotamiz",
    short_name: "Sotamiz",
    description: "Ko'chmas mulk e'lonlari, maqolalar va boshqaruv paneli.",
    start_url: "/uz",
    scope: "/",
    display: "standalone",
    background_color: "#0d3b66",
    theme_color: "#0d3b66",
    lang: "uz",
    icons: [
      {
        src: "/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
