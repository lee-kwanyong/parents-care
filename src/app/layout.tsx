import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "부모님 케어 플랫폼",
  description: "40대 이상 자녀가 부모님 병원, 식사, 약, 퇴원 후 케어, 서류, 안부 걱정을 쉽게 맡기는 플랫폼",
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
  { href: "/care-request", label: "걱정접수" },
  { href: "/care-difference", label: "차별화" },
  { href: "/care-packs", label: "케어팩" },
  { href: "/child", label: "자녀홈" },
  { href: "/care-passport", label: "케어패스포트" },
  { href: "/care-meals", label: "안심밥상" },
  { href: "/parent/today", label: "부모님" },
  { href: "/ops", label: "운영실" },
  { href: "/impact", label: "사회공헌" },
  { href: "/login", label: "로그인" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="logo" aria-label="홈으로 이동">
              부모님 케어 플랫폼
              <small>걱정 접수 · 안심 확인 · 생활 돌봄</small>
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
