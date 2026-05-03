import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "부모님 안심동행 케어",
  description: "부모님 병원동행 예약, 진행상황, 케어리포트 운영 시스템",
  appleWebApp: {
    capable: true,
    title: "안심동행",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#24584d",
  width: "device-width",
  initialScale: 1
};

const nav = [
  { href: "/care-room", label: "케어룸" },
  { href: "/child", label: "자녀앱" },
  { href: "/parent/today", label: "부모님앱" },
  { href: "/manager/today", label: "매니저앱" },
  { href: "/ops", label: "운영실" },
  { href: "/login", label: "로그인" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="logo" aria-label="홈으로 이동">
              부모님 안심동행 케어
              <small>예약 · 동행 · 리포트 · 케어룸</small>
            </Link>
            <nav className="nav" aria-label="역할별 메뉴">
              {nav.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
            </nav>
          </header>
          {children}
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
