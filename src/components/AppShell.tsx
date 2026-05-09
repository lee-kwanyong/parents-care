import Link from 'next/link'
import type { ReactNode } from 'react'

const navItems = [
  ['/', '홈'],
  ['/care-request', '걱정 접수'],
  ['/care-packs', '케어팩'],
  ['/care-passport', '케어패스포트'],
  ['/care-meal', '안심밥상'],
  ['/impact', '사회공헌'],
  ['/ops/worry-center', '운영실'],
  ['/account', '계정']
] as const

export function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-[#2F4948]">
      <header className="sticky top-0 z-20 border-b border-[#E0EFEC] bg-white shadow-[0_8px_24px_rgba(82,112,108,0.08)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-care-500 text-xl font-black text-[#2E504D]">효</span>
            <span>
              <strong className="block text-lg">부모님 케어 플랫폼</strong>
              <span className="text-sm text-[#7A9692]">부모님 걱정을 쉽게 맡기는 앱</span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            {navItems.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full border border-[#E0EFEC] bg-white px-3 py-2 font-semibold text-[#4E6D69] hover:border-care-500 hover:text-care-700">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {title ? (
          <section className="mb-8 rounded-[2rem] bg-gradient-to-br from-care-100 to-white p-6 shadow-soft">
            <p className="mb-2 text-sm font-bold text-care-700">40대 이상 보호자 맞춤 · 쉬운 케어</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-3 max-w-3xl text-lg leading-8 text-[#4E6D69]">{subtitle}</p> : null}
          </section>
        ) : null}
        {children}
      </main>
    </div>
  )
}
