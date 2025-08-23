import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IDKDO",
    short_name: "IDKDO",
    description: "Organisez et partagez vos listes de cadeaux en famille ou entre amis.",
    icons: [
      {
        src: "/IDKDO@192.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/IDKDO@512.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
  };
}