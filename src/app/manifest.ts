import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "부모님 케어 플랫폼",
    short_name: "부모님케어",
    description: "부모님 병원, 식사, 약, 퇴원 후 케어, 서류, 안부 걱정을 쉽게 맡기는 플랫폼",
    start_url: "/care-request",
    display: "standalone",
    background_color: "#f6f3ed",
    theme_color: "#24584d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
