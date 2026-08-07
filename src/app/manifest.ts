import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Cards",
    short_name: "Cards",
    description: "Digital business cards, lead capture, and CRM sync.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f1f2f5",
    theme_color: "#f1f2f5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
