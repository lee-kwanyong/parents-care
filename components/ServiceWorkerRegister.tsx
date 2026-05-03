"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 설치형 PWA 경험을 보조하는 선택 기능입니다. 실패해도 앱 동작에는 영향이 없습니다.
    });
  }, []);

  return null;
}
