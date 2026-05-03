import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "부모님 안심동행 케어",
    short_name: "안심동행",
    description: "부모님 병원동행 예약, 진행상황, 보호자 리포트, 공동 케어룸",
    start_url: "/parent/today",
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
